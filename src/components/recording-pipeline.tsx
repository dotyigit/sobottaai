"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRecordingStore } from "@/stores/recording-store";
import { useSettingsStore } from "@/stores/settings-store";

/**
 * Headless component that manages the global recording pipeline.
 * Mounted in layout.tsx so it works regardless of which page is active.
 * Only activates in the "main" window — the recording-bar window skips it.
 *
 * Listens for Tauri events:
 *   recording-started  → updates store, starts timer
 *   recording-stopped  → stops timer, runs transcribe → rules → AI → paste → save
 */

async function tauriListen<T>(
  event: string,
  handler: (payload: T) => void,
): Promise<(() => void) | undefined> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen<T>(event, (e) => handler(e.payload));
  } catch {
    return undefined;
  }
}

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

async function tauriEmit(event: string, payload?: unknown): Promise<void> {
  try {
    const { emit } = await import("@tauri-apps/api/event");
    await emit(event, payload);
  } catch {
    // Outside Tauri context
  }
}

/**
 * Whisper hallucinates common phrases on silent / near-silent audio.
 * This filter catches the most frequent patterns and discards them.
 */
const HALLUCINATION_PATTERNS = [
  /^\[.*\]$/, // [BLANK_AUDIO], [Music], [Applause], etc.
  /^\(.*\)$/, // (music), (silence), etc.
  /^thank(s| you)/i,
  /^please subscribe/i,
  /^like and subscribe/i,
  /^thanks for watching/i,
  /^the end\.?$/i,
  /^subtitle/i,
  /^copyright/i,
  /^you$/i,
  /^\.+$/,    // just dots
];

function isHallucination(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  // Very short output (≤3 chars) on what was supposedly speech is suspicious
  if (t.length <= 3) return true;
  return HALLUCINATION_PATTERNS.some((re) => re.test(t));
}

interface StopResult {
  sessionId: string;
  durationMs: number;
  sampleCount: number;
}

interface TranscriptionResult {
  text: string;
  language: string | null;
  segments: { startMs: number; endMs: number; text: string }[];
  durationMs: number;
}

export function RecordingPipeline() {
  // Only activate in the main window — skip in recording-bar to prevent double paste
  const [isMainWindow, setIsMainWindow] = useState(false);
  useEffect(() => {
    import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) => {
        setIsMainWindow(getCurrentWindow().label === "main");
      })
      .catch(() => {
        // Outside Tauri context (e.g. dev browser) — act as main
        setIsMainWindow(true);
      });
  }, []);

  const {
    beginRecording,
    setIsRecording,
    setIsTranscribing,
    setSessionId,
    setLastResult,
    setDurationMs,
    setAudioLevel,
    reset,
  } = useRecordingStore();

  const {
    selectedModel,
    selectedLanguage,
    selectedAiFunction,
    rules,
    llmProvider,
    providerConfigs,
  } = useSettingsStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Generation counter — incremented every time a new recording cycle begins.
  // Used to detect when an old transcription's cleanup would interfere with
  // a newer recording cycle (e.g. hiding the bar, emitting "complete").
  const generationRef = useRef(0);

  // Keep refs current so the event handlers always use latest settings
  const selectedModelRef = useRef(selectedModel);
  const selectedLanguageRef = useRef(selectedLanguage);
  const selectedAiFunctionRef = useRef(selectedAiFunction);
  const rulesRef = useRef(rules);
  const llmProviderRef = useRef(llmProvider);
  const providerConfigsRef = useRef(providerConfigs);

  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);
  useEffect(() => { selectedLanguageRef.current = selectedLanguage; }, [selectedLanguage]);
  useEffect(() => { selectedAiFunctionRef.current = selectedAiFunction; }, [selectedAiFunction]);
  useEffect(() => { rulesRef.current = rules; }, [rules]);
  useEffect(() => { llmProviderRef.current = llmProvider; }, [llmProvider]);
  useEffect(() => { providerConfigsRef.current = providerConfigs; }, [providerConfigs]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setDurationMs(Date.now() - startTimeRef.current);
    }, 100);
  }, [setDurationMs]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const transcribeAndPaste = useCallback(
    async (sid: string, recordingDurationMs?: number) => {
      // Capture the current generation — if it changes during async work,
      // a new recording cycle has started and we must not touch UI state.
      const gen = generationRef.current;
      const isCurrent = () => generationRef.current === gen;

      setIsTranscribing(true);
      tauriEmit("pipeline-state", "transcribing");
      try {
        const lang = selectedLanguageRef.current;
        const modelId = selectedModelRef.current;
        const aiFunctionId = selectedAiFunctionRef.current;
        const enabledRules = rulesRef.current
          .filter((r) => r.enabled)
          .map((r) => r.id);

        // Cloud model API keys
        let transcribeApiKey: string | null = null;
        let transcribeCloudModel: string | null = null;
        if (modelId === "cloud-openai-whisper") {
          transcribeApiKey = providerConfigsRef.current["openai"]?.apiKey ?? null;
        } else if (modelId === "cloud-groq-whisper") {
          transcribeApiKey = providerConfigsRef.current["groq"]?.apiKey ?? null;
          transcribeCloudModel = providerConfigsRef.current["groq"]?.model ?? null;
        }

        const result = await tauriInvoke<TranscriptionResult>("transcribe", {
          sessionId: sid,
          modelId,
          language: lang === "auto" ? null : lang,
          apiKey: transcribeApiKey,
          cloudModel: transcribeCloudModel,
        });

        const trimmed = result.text.trim();
        if (!trimmed || isHallucination(trimmed)) {
          if (isCurrent()) setLastResult("");
          return;
        }

        let finalText = result.text;

        // Apply regex rules
        if (enabledRules.length > 0) {
          finalText = await tauriInvoke<string>("apply_rules", {
            text: finalText,
            enabledRuleIds: enabledRules,
          });
        }

        // Apply AI function
        let processedText: string | null = null;
        const activeProvider = llmProviderRef.current;
        const activeConfig = providerConfigsRef.current[activeProvider];
        console.log("[pipeline] AI function check:", {
          aiFunctionId,
          activeProvider,
          hasApiKey: !!activeConfig?.apiKey,
          model: activeConfig?.model,
        });
        if (aiFunctionId && (activeConfig?.apiKey || activeProvider === "ollama")) {
          console.log("[pipeline] Starting AI processing with:", activeProvider, activeConfig?.model);
          if (isCurrent()) tauriEmit("pipeline-state", "ai-processing");
          try {
            processedText = await tauriInvoke<string>("execute_ai_function", {
              text: finalText,
              functionId: aiFunctionId,
              llmProvider: activeProvider,
              llmApiKey: activeConfig?.apiKey ?? "",
              llmModel: activeConfig?.model ?? "",
            });
            console.log("[pipeline] AI function returned:", processedText?.length, "chars");
            finalText = processedText;
          } catch (err) {
            console.error("[pipeline] AI function failed:", err);
            if (isCurrent()) toast.error("AI function failed", { description: String(err) });
          }
        } else if (aiFunctionId) {
          console.warn("[pipeline] AI function selected but no API key configured for provider:", activeProvider);
        }

        if (isCurrent()) setLastResult(finalText);

        // Paste — only if this is still the active cycle
        if (isCurrent()) {
          await tauriInvoke("paste_text", { text: finalText });
        }

        // Save to history — always save, even if a new recording started
        await tauriInvoke("save_history_item", {
          sessionId: sid,
          transcript: result.text,
          processedText,
          modelId,
          language: lang === "auto" ? null : lang,
          aiFunction: aiFunctionId,
          durationMs: recordingDurationMs ?? result.durationMs,
        }).catch((err: unknown) => {
          console.error("Failed to save history:", err);
        });
      } catch (err) {
        console.error("Transcription failed:", err);
        if (isCurrent()) {
          toast.error("Transcription failed", { description: String(err) });
          setLastResult(null);
        }
      } finally {
        // Only clean up UI if this is still the active cycle.
        // If a new recording started, its own cycle owns the UI now.
        if (isCurrent()) {
          setIsTranscribing(false);
          await tauriEmit("pipeline-state", "complete");
          await new Promise((r) => setTimeout(r, 100));
          tauriInvoke("hide_recording_bar").catch(() => {});
        }
      }
    },
    [setIsTranscribing, setLastResult],
  );

  // Global event listeners — only active in the main window
  useEffect(() => {
    if (!isMainWindow) return;

    let cancelled = false;
    const cleanups: ((() => void) | undefined)[] = [];

    const setup = async () => {
      if (cancelled) return;

      // Listen for "recording-will-start" — emitted BEFORE the blocking audio
      // init in Rust (~50-200ms).  This resets the store immediately so the UI
      // never shows stale "transcribing" state from the previous cycle.
      // Incrementing the generation invalidates any in-flight transcription's
      // cleanup (hide bar, emit "complete", etc.).
      cleanups.push(
        await tauriListen("recording-will-start", () => {
          if (cancelled) return;
          generationRef.current++;
          beginRecording();
        }),
      );

      cleanups.push(
        await tauriListen("recording-started", () => {
          if (cancelled) return;
          // Audio thread confirmed — start the timer.
          // State is already set by recording-will-start above.
          beginRecording();
          startTimer();
        }),
      );

      cleanups.push(
        await tauriListen<StopResult>("recording-stopped", (payload) => {
          if (cancelled) return;
          stopTimer();
          setIsRecording(false);
          setAudioLevel(0);
          setDurationMs(payload.durationMs);
          if (!payload.sessionId) {
            reset();
            return;
          }
          setSessionId(payload.sessionId);
          transcribeAndPaste(payload.sessionId, payload.durationMs);
        }),
      );

      // Audio level meter — smooth and forward to store
      let smoothed = 0;
      cleanups.push(
        await tauriListen<number>("audio-level", (level) => {
          if (cancelled) return;
          // Fast attack, slow release for natural VU meter feel
          smoothed =
            level > smoothed ? level * 0.7 + smoothed * 0.3 : level * 0.2 + smoothed * 0.8;
          setAudioLevel(smoothed);
        }),
      );
    };

    setup();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn?.());
    };
  }, [
    isMainWindow,
    beginRecording,
    setIsRecording,
    setSessionId,
    setDurationMs,
    setAudioLevel,
    startTimer,
    stopTimer,
    transcribeAndPaste,
    reset,
  ]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  return null; // headless
}

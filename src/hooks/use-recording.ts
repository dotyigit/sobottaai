import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRecordingStore } from "@/stores/recording-store";
import { useSettingsStore } from "@/stores/settings-store";

// Lazy import helpers to avoid crashes when Tauri IPC isn't ready
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

/**
 * Hook that orchestrates the full recording pipeline:
 * hotkey/click → record → stop → transcribe → rules → AI → paste → save
 *
 * IMPORTANT: Only the "recording-stopped" event triggers transcription.
 * This prevents duplicate transcription when button click + event both fire.
 */
export function useRecording() {
  const {
    isRecording,
    isTranscribing,
    isProcessing,
    sessionId,
    lastResult,
    durationMs,
    setIsRecording,
    setIsTranscribing,
    setSessionId,
    setLastResult,
    setDurationMs,
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
  // Guard to prevent concurrent transcription
  const transcribingRef = useRef(false);

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

  // Transcribe → apply rules → AI function → paste → save history
  const transcribeAndPaste = useCallback(
    async (sid: string, recordingDurationMs?: number) => {
      // Guard: only one transcription at a time
      if (transcribingRef.current) return;
      transcribingRef.current = true;
      setIsTranscribing(true);
      try {
        const lang = selectedLanguageRef.current;
        const modelId = selectedModelRef.current;
        const aiFunctionId = selectedAiFunctionRef.current;
        const enabledRules = rulesRef.current
          .filter((r) => r.enabled)
          .map((r) => r.id);

        // Step 1: Transcribe
        // For cloud models, pass the relevant provider API key
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

        if (!result.text.trim()) {
          setLastResult("");
          return;
        }

        let finalText = result.text;

        // Step 2: Apply regex rules (filler removal, punctuation)
        if (enabledRules.length > 0) {
          finalText = await tauriInvoke<string>("apply_rules", {
            text: finalText,
            enabledRuleIds: enabledRules,
          });
        }

        // Step 3: Apply AI function (if selected and API key configured)
        let processedText: string | null = null;
        const activeProvider = llmProviderRef.current;
        const activeConfig = providerConfigsRef.current[activeProvider];
        if (aiFunctionId && (activeConfig?.apiKey || activeProvider === "ollama")) {
          try {
            processedText = await tauriInvoke<string>("execute_ai_function", {
              text: finalText,
              functionId: aiFunctionId,
              llmProvider: activeProvider,
              llmApiKey: activeConfig?.apiKey ?? "",
              llmModel: activeConfig?.model ?? "",
            });
            finalText = processedText;
          } catch (err) {
            console.error("AI function failed:", err);
            toast.error("AI function failed", { description: String(err) });
          }
        }

        setLastResult(finalText);

        // Step 4: Paste
        await tauriInvoke("paste_text", { text: finalText });

        // Step 5: Save to history
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
          toast.error("Failed to save to history", { description: String(err) });
        });
      } catch (err) {
        console.error("Transcription failed:", err);
        toast.error("Transcription failed", { description: String(err) });
        setLastResult(null);
      } finally {
        transcribingRef.current = false;
        setIsTranscribing(false);
      }
    },
    [setIsTranscribing, setLastResult],
  );

  // Manual start recording (from button click)
  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      reset();
      await tauriInvoke("start_recording");
      // NOTE: We don't set isRecording here — the "recording-started" event does it.
      // This prevents double-setting when both the command return and event fire.
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Failed to start recording", { description: String(err) });
      reset();
    }
  }, [isRecording, reset]);

  // Manual stop recording (from button click)
  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    try {
      await tauriInvoke("stop_recording");
      // NOTE: We don't call transcribeAndPaste here.
      // The "recording-stopped" event handler will trigger it exactly once.
    } catch (err) {
      console.error("Failed to stop recording:", err);
      toast.error("Failed to stop recording", { description: String(err) });
      reset();
    }
  }, [isRecording, reset]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Listen for Tauri events from the Rust backend.
  // This is the SINGLE source of truth for recording state changes and transcription.
  useEffect(() => {
    let cancelled = false;
    const cleanups: ((() => void) | undefined)[] = [];

    const setup = async () => {
      if (cancelled) return;

      cleanups.push(
        await tauriListen("recording-started", () => {
          if (cancelled) return;
          setIsRecording(true);
          setDurationMs(0);
          startTimer();
        }),
      );

      cleanups.push(
        await tauriListen<StopResult>("recording-stopped", (payload) => {
          if (cancelled) return;
          stopTimer();
          setIsRecording(false);
          setSessionId(payload.sessionId);
          setDurationMs(payload.durationMs);
          transcribeAndPaste(payload.sessionId, payload.durationMs);
        }),
      );
    };

    setup();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn?.());
    };
  }, [
    setIsRecording,
    setSessionId,
    setDurationMs,
    startTimer,
    stopTimer,
    transcribeAndPaste,
  ]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  return {
    isRecording,
    isTranscribing,
    isProcessing,
    sessionId,
    lastResult,
    durationMs,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}

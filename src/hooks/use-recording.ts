import { useCallback, useEffect, useRef } from "react";
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
 * hotkey/click → record → stop → transcribe → paste
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
    llmApiKey,
    llmModel,
  } = useSettingsStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const selectedModelRef = useRef(selectedModel);
  const selectedLanguageRef = useRef(selectedLanguage);
  const selectedAiFunctionRef = useRef(selectedAiFunction);
  const rulesRef = useRef(rules);
  const llmProviderRef = useRef(llmProvider);
  const llmApiKeyRef = useRef(llmApiKey);
  const llmModelRef = useRef(llmModel);
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);
  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);
  useEffect(() => {
    selectedAiFunctionRef.current = selectedAiFunction;
  }, [selectedAiFunction]);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);
  useEffect(() => {
    llmProviderRef.current = llmProvider;
  }, [llmProvider]);
  useEffect(() => {
    llmApiKeyRef.current = llmApiKey;
  }, [llmApiKey]);
  useEffect(() => {
    llmModelRef.current = llmModel;
  }, [llmModel]);

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
      setIsTranscribing(true);
      try {
        const lang = selectedLanguageRef.current;
        const modelId = selectedModelRef.current;
        const aiFunctionId = selectedAiFunctionRef.current;
        const enabledRules = rulesRef.current
          .filter((r) => r.enabled)
          .map((r) => r.id);

        // Step 1: Transcribe
        const result = await tauriInvoke<TranscriptionResult>("transcribe", {
          sessionId: sid,
          modelId,
          language: lang === "auto" ? null : lang,
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
        if (aiFunctionId && llmApiKeyRef.current) {
          try {
            processedText = await tauriInvoke<string>("execute_ai_function", {
              text: finalText,
              functionId: aiFunctionId,
              llmProvider: llmProviderRef.current,
              llmApiKey: llmApiKeyRef.current,
              llmModel: llmModelRef.current,
            });
            finalText = processedText;
          } catch (err) {
            console.error("AI function failed:", err);
            // Continue with un-processed text
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
        });
      } catch (err) {
        console.error("Transcription failed:", err);
        setLastResult(`[Error: ${err}]`);
      } finally {
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
      setIsRecording(true);
      startTimer();
      await tauriInvoke("show_recording_bar").catch(() => {});
    } catch (err) {
      console.error("Failed to start recording:", err);
      reset();
    }
  }, [isRecording, reset, setIsRecording, startTimer]);

  // Manual stop recording (from button click)
  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    try {
      stopTimer();
      setIsRecording(false);
      await tauriInvoke("hide_recording_bar").catch(() => {});

      const result = await tauriInvoke<StopResult>("stop_recording");
      setSessionId(result.sessionId);
      setDurationMs(result.durationMs);

      await transcribeAndPaste(result.sessionId, result.durationMs);
    } catch (err) {
      console.error("Failed to stop recording:", err);
      reset();
    }
  }, [
    isRecording,
    stopTimer,
    setIsRecording,
    setSessionId,
    setDurationMs,
    transcribeAndPaste,
    reset,
  ]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Listen for Tauri events from the Rust backend
  useEffect(() => {
    const cleanups: ((() => void) | undefined)[] = [];

    const setup = async () => {
      cleanups.push(
        await tauriListen("recording-started", () => {
          setIsRecording(true);
          setDurationMs(0);
          startTimer();
        }),
      );

      cleanups.push(
        await tauriListen<StopResult>("recording-stopped", (payload) => {
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

import { useCallback, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { useRecordingStore } from "@/stores/recording-store";
import { useSettingsStore } from "@/stores/settings-store";
import * as commands from "@/lib/tauri-commands";

/**
 * Hook that orchestrates the full recording pipeline:
 * hotkey/click → record → stop → transcribe → paste
 *
 * The global hotkey (Cmd+Shift+Space) handles start/stop in Rust.
 * This hook listens for the events and runs transcription + paste.
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

  const { selectedModel, selectedLanguage } = useSettingsStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Refs to access latest values in event callbacks
  const selectedModelRef = useRef(selectedModel);
  const selectedLanguageRef = useRef(selectedLanguage);
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);
  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

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

  // Transcribe and auto-paste
  const transcribeAndPaste = useCallback(
    async (sessionId: string, durationMs: number) => {
      setIsTranscribing(true);
      try {
        const lang = selectedLanguageRef.current;
        const result = await commands.transcribe(
          sessionId,
          selectedModelRef.current,
          lang === "auto" ? undefined : lang,
        );

        setLastResult(result.text);

        if (result.text.trim()) {
          // Auto-paste into the active application
          await commands.pasteText(result.text);
          console.log(
            `Transcribed and pasted (${result.durationMs}ms): ${result.text}`,
          );
        }
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
      await commands.startRecording();
      setIsRecording(true);
      startTimer();
      await commands.showRecordingBar().catch(() => {});
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
      await commands.hideRecordingBar().catch(() => {});

      const result = await commands.stopRecording();
      setSessionId(result.sessionId);
      setDurationMs(result.durationMs);

      // Transcribe and paste
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

  // Toggle recording (for button clicks)
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Listen for hotkey events from Rust
  // In push-to-talk mode, Rust handles start/stop recording directly.
  // We listen for recording-stopped to trigger transcription + paste.
  useEffect(() => {
    const unlisteners: Promise<() => void>[] = [];

    // Recording started (from hotkey or manual)
    unlisteners.push(
      listen("recording-started", () => {
        setIsRecording(true);
        setDurationMs(0);
        startTimer();
      }),
    );

    // Recording stopped (from hotkey or manual) — trigger transcription
    unlisteners.push(
      listen<commands.StopResult>("recording-stopped", (event) => {
        stopTimer();
        setIsRecording(false);
        setSessionId(event.payload.sessionId);
        setDurationMs(event.payload.durationMs);

        // Run transcription + auto-paste
        transcribeAndPaste(
          event.payload.sessionId,
          event.payload.durationMs,
        );
      }),
    );

    return () => {
      unlisteners.forEach((p) => p.then((f) => f()));
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

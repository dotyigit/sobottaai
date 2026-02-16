import { useCallback, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { useRecordingStore } from "@/stores/recording-store";
import { useSettingsStore } from "@/stores/settings-store";
import * as commands from "@/lib/tauri-commands";

/**
 * Hook that orchestrates the full recording pipeline:
 * start → capture audio → stop → transcribe → (rules → AI function → paste)
 *
 * Phase 3 adds transcription after recording stops.
 * Rules, AI functions, and paste will be wired in Phase 5.
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

  // Duration timer
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

  // Start recording
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
      throw err;
    }
  }, [isRecording, reset, setIsRecording, startTimer]);

  // Stop recording and transcribe
  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    try {
      stopTimer();
      setIsRecording(false);
      await commands.hideRecordingBar().catch(() => {});

      const result = await commands.stopRecording();
      setSessionId(result.sessionId);
      setDurationMs(result.durationMs);

      // Transcribe the recording
      setIsTranscribing(true);
      try {
        const transcription = await commands.transcribe(
          result.sessionId,
          selectedModel,
          selectedLanguage === "auto" ? undefined : selectedLanguage,
        );
        setLastResult(transcription.text);

        // TODO Phase 5: apply rules → AI function → paste
        console.log(
          `Transcription (${transcription.durationMs}ms): ${transcription.text}`,
        );
      } catch (err) {
        console.error("Transcription failed:", err);
        setLastResult(`[Transcription failed: ${err}]`);
      } finally {
        setIsTranscribing(false);
      }

      return result;
    } catch (err) {
      console.error("Failed to stop recording:", err);
      reset();
      throw err;
    }
  }, [
    isRecording,
    stopTimer,
    setIsRecording,
    setSessionId,
    setDurationMs,
    setIsTranscribing,
    setLastResult,
    selectedModel,
    selectedLanguage,
    reset,
  ]);

  // Toggle recording (for toggle mode)
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Listen for Tauri events
  useEffect(() => {
    const unlisteners: Promise<() => void>[] = [];

    unlisteners.push(
      listen("recording-started", () => {
        if (!isRecording) {
          setIsRecording(true);
          startTimer();
        }
      }),
    );

    unlisteners.push(
      listen<commands.StopResult>("recording-stopped", (event) => {
        if (isRecording) {
          stopTimer();
          setIsRecording(false);
          setSessionId(event.payload.sessionId);
          setDurationMs(event.payload.durationMs);
        }
      }),
    );

    return () => {
      unlisteners.forEach((p) => p.then((f) => f()));
    };
  }, [
    isRecording,
    setIsRecording,
    setSessionId,
    setDurationMs,
    startTimer,
    stopTimer,
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

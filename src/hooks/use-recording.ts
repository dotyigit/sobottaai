import { useCallback, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { useRecordingStore } from "@/stores/recording-store";
import { useSettingsStore } from "@/stores/settings-store";
import * as commands from "@/lib/tauri-commands";

/**
 * Hook that orchestrates the recording pipeline:
 * start → capture audio → stop → (transcribe → rules → AI function → paste)
 *
 * Phase 2 covers start/stop recording.
 * Transcription and post-processing will be wired in Phase 4.
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

  const { selectedModel, selectedLanguage, selectedAiFunction } =
    useSettingsStore();

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
      // Show floating recording bar
      await commands.showRecordingBar().catch(() => {});
    } catch (err) {
      console.error("Failed to start recording:", err);
      reset();
      throw err;
    }
  }, [isRecording, reset, setIsRecording, startTimer]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    try {
      stopTimer();
      setIsRecording(false);
      // Hide floating recording bar
      await commands.hideRecordingBar().catch(() => {});

      const result = await commands.stopRecording();
      setSessionId(result.sessionId);
      setDurationMs(result.durationMs);

      // TODO Phase 4: transcribe → apply rules → AI function → paste
      // For now, just log the session
      console.log(
        `Recording complete: session=${result.sessionId}, duration=${result.durationMs}ms, samples=${result.sampleCount}`,
      );

      return result;
    } catch (err) {
      console.error("Failed to stop recording:", err);
      reset();
      throw err;
    }
  }, [isRecording, stopTimer, setIsRecording, setSessionId, setDurationMs, reset]);

  // Toggle recording (for toggle mode)
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Listen for Tauri events (from hotkey or other sources)
  useEffect(() => {
    const unlisteners: Promise<() => void>[] = [];

    unlisteners.push(
      listen("recording-started", () => {
        // Sync state if recording was started externally (e.g. hotkey)
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
  }, [isRecording, setIsRecording, setSessionId, setDurationMs, startTimer, stopTimer]);

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

import { useCallback } from "react";
import { toast } from "sonner";
import { useRecordingStore } from "@/stores/recording-store";

/**
 * Lightweight hook for UI components that need recording controls.
 * The actual pipeline (events → transcribe → paste → save) lives in
 * RecordingPipeline (mounted globally in layout.tsx).
 *
 * This hook only provides:
 *   - State from the global recording store
 *   - Button click handlers (start/stop/toggle)
 */

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

export function useRecording() {
  const {
    isRecording,
    isTranscribing,
    isProcessing,
    sessionId,
    lastResult,
    durationMs,
    audioLevel,
    beginRecording,
    reset,
  } = useRecordingStore();

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      // Emit before the blocking start_recording so pipeline + recording bar
      // can reset state (same event the hotkey handler emits from Rust).
      await tauriEmit("recording-will-start");
      beginRecording();
      await tauriInvoke("start_recording");
      await tauriInvoke("show_recording_bar").catch(() => {});
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Failed to start recording", { description: String(err) });
      reset();
    }
  }, [isRecording, beginRecording, reset]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    try {
      await tauriInvoke("stop_recording");
      // Don't hide the recording bar here — RecordingPipeline will hide it
      // after transcription (+ AI processing if active) completes.
    } catch (err) {
      console.error("Failed to stop recording:", err);
      toast.error("Failed to stop recording", { description: String(err) });
      reset();
      await tauriInvoke("hide_recording_bar").catch(() => {});
    }
  }, [isRecording, reset]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isTranscribing,
    isProcessing,
    sessionId,
    lastResult,
    durationMs,
    audioLevel,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}

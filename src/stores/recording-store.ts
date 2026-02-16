import { create } from "zustand";

interface RecordingState {
  isRecording: boolean;
  isTranscribing: boolean;
  isProcessing: boolean;
  sessionId: string | null;
  lastResult: string | null;
  durationMs: number;
  setIsRecording: (value: boolean) => void;
  setIsTranscribing: (value: boolean) => void;
  setIsProcessing: (value: boolean) => void;
  setSessionId: (id: string | null) => void;
  setLastResult: (text: string | null) => void;
  setDurationMs: (ms: number) => void;
  reset: () => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  isTranscribing: false,
  isProcessing: false,
  sessionId: null,
  lastResult: null,
  durationMs: 0,
  setIsRecording: (value) => set({ isRecording: value }),
  setIsTranscribing: (value) => set({ isTranscribing: value }),
  setIsProcessing: (value) => set({ isProcessing: value }),
  setSessionId: (id) => set({ sessionId: id }),
  setLastResult: (text) => set({ lastResult: text }),
  setDurationMs: (ms) => set({ durationMs: ms }),
  reset: () =>
    set({
      isRecording: false,
      isTranscribing: false,
      isProcessing: false,
      sessionId: null,
      durationMs: 0,
    }),
}));

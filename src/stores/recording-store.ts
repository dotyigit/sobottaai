import { create } from "zustand";

interface RecordingState {
  isRecording: boolean;
  isTranscribing: boolean;
  isProcessing: boolean;
  sessionId: string | null;
  lastResult: string | null;
  durationMs: number;
  audioLevel: number;
  beginRecording: () => void;
  setIsRecording: (value: boolean) => void;
  setIsTranscribing: (value: boolean) => void;
  setIsProcessing: (value: boolean) => void;
  setSessionId: (id: string | null) => void;
  setLastResult: (text: string | null) => void;
  setDurationMs: (ms: number) => void;
  setAudioLevel: (level: number) => void;
  reset: () => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  isTranscribing: false,
  isProcessing: false,
  sessionId: null,
  lastResult: null,
  durationMs: 0,
  audioLevel: 0,
  beginRecording: () =>
    set({
      isRecording: true,
      isTranscribing: false,
      isProcessing: false,
      sessionId: null,
      durationMs: 0,
      audioLevel: 0,
    }),
  setIsRecording: (value) => set({ isRecording: value }),
  setIsTranscribing: (value) => set({ isTranscribing: value }),
  setIsProcessing: (value) => set({ isProcessing: value }),
  setSessionId: (id) => set({ sessionId: id }),
  setLastResult: (text) => set({ lastResult: text }),
  setDurationMs: (ms) => set({ durationMs: ms }),
  setAudioLevel: (level) => set({ audioLevel: level }),
  reset: () =>
    set({
      isRecording: false,
      isTranscribing: false,
      isProcessing: false,
      sessionId: null,
      durationMs: 0,
      audioLevel: 0,
    }),
}));

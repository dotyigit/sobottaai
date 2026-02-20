import { describe, it, expect, beforeEach } from "vitest";
import { useRecordingStore } from "@/stores/recording-store";

beforeEach(() => {
  useRecordingStore.getState().reset();
});

describe("recording-store", () => {
  // ── Default state ─────────────────────────────────────────

  describe("default state", () => {
    it("isRecording is false", () => {
      expect(useRecordingStore.getState().isRecording).toBe(false);
    });

    it("isTranscribing is false", () => {
      expect(useRecordingStore.getState().isTranscribing).toBe(false);
    });

    it("isProcessing is false", () => {
      expect(useRecordingStore.getState().isProcessing).toBe(false);
    });

    it("sessionId is null", () => {
      expect(useRecordingStore.getState().sessionId).toBeNull();
    });

    it("lastResult is null", () => {
      expect(useRecordingStore.getState().lastResult).toBeNull();
    });

    it("durationMs is 0", () => {
      expect(useRecordingStore.getState().durationMs).toBe(0);
    });

    it("audioLevel is 0", () => {
      expect(useRecordingStore.getState().audioLevel).toBe(0);
    });
  });

  // ── Setters ───────────────────────────────────────────────

  describe("setters", () => {
    it("setIsRecording updates state", () => {
      useRecordingStore.getState().setIsRecording(true);
      expect(useRecordingStore.getState().isRecording).toBe(true);
    });

    it("setIsTranscribing updates state", () => {
      useRecordingStore.getState().setIsTranscribing(true);
      expect(useRecordingStore.getState().isTranscribing).toBe(true);
    });

    it("setIsProcessing updates state", () => {
      useRecordingStore.getState().setIsProcessing(true);
      expect(useRecordingStore.getState().isProcessing).toBe(true);
    });

    it("setSessionId updates state", () => {
      useRecordingStore.getState().setSessionId("session-123");
      expect(useRecordingStore.getState().sessionId).toBe("session-123");
    });

    it("setLastResult updates state", () => {
      useRecordingStore.getState().setLastResult("Hello world");
      expect(useRecordingStore.getState().lastResult).toBe("Hello world");
    });

    it("setDurationMs updates state", () => {
      useRecordingStore.getState().setDurationMs(5000);
      expect(useRecordingStore.getState().durationMs).toBe(5000);
    });

    it("setAudioLevel updates state", () => {
      useRecordingStore.getState().setAudioLevel(0.75);
      expect(useRecordingStore.getState().audioLevel).toBe(0.75);
    });
  });

  // ── Reset ─────────────────────────────────────────────────

  describe("reset", () => {
    it("resets all recording state", () => {
      const store = useRecordingStore.getState();
      store.setIsRecording(true);
      store.setIsTranscribing(true);
      store.setIsProcessing(true);
      store.setSessionId("session-abc");
      store.setDurationMs(12345);
      store.setAudioLevel(0.9);

      useRecordingStore.getState().reset();

      const state = useRecordingStore.getState();
      expect(state.isRecording).toBe(false);
      expect(state.isTranscribing).toBe(false);
      expect(state.isProcessing).toBe(false);
      expect(state.sessionId).toBeNull();
      expect(state.durationMs).toBe(0);
      expect(state.audioLevel).toBe(0);
    });

    it("preserves lastResult after reset", () => {
      useRecordingStore.getState().setLastResult("Important result");
      useRecordingStore.getState().reset();
      // lastResult is NOT cleared by reset — intentional so user can still see it
      expect(useRecordingStore.getState().lastResult).toBe("Important result");
    });
  });

  // ── State transitions ─────────────────────────────────────

  describe("state transitions", () => {
    it("simulates recording → transcribing → done", () => {
      const store = useRecordingStore.getState();

      // Start recording
      store.setIsRecording(true);
      store.setSessionId("session-1");
      expect(useRecordingStore.getState().isRecording).toBe(true);

      // Stop recording, start transcribing
      store.setIsRecording(false);
      store.setIsTranscribing(true);
      expect(useRecordingStore.getState().isRecording).toBe(false);
      expect(useRecordingStore.getState().isTranscribing).toBe(true);

      // Done transcribing
      store.setIsTranscribing(false);
      store.setLastResult("Transcribed text");
      expect(useRecordingStore.getState().isTranscribing).toBe(false);
      expect(useRecordingStore.getState().lastResult).toBe("Transcribed text");
    });

    it("simulates recording → transcribing → processing → done", () => {
      const store = useRecordingStore.getState();

      store.setIsRecording(true);
      store.setIsRecording(false);
      store.setIsTranscribing(true);
      store.setIsTranscribing(false);
      store.setIsProcessing(true);
      expect(useRecordingStore.getState().isProcessing).toBe(true);

      store.setIsProcessing(false);
      store.setLastResult("Processed text");
      expect(useRecordingStore.getState().isProcessing).toBe(false);
      expect(useRecordingStore.getState().lastResult).toBe("Processed text");
    });

    it("audio level updates during recording", () => {
      const store = useRecordingStore.getState();
      store.setIsRecording(true);

      store.setAudioLevel(0.1);
      expect(useRecordingStore.getState().audioLevel).toBe(0.1);

      store.setAudioLevel(0.8);
      expect(useRecordingStore.getState().audioLevel).toBe(0.8);

      store.setAudioLevel(0.3);
      expect(useRecordingStore.getState().audioLevel).toBe(0.3);
    });

    it("duration accumulates during recording", () => {
      const store = useRecordingStore.getState();
      store.setDurationMs(100);
      store.setDurationMs(500);
      store.setDurationMs(1000);
      expect(useRecordingStore.getState().durationMs).toBe(1000);
    });
  });
});

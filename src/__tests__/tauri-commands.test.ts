import { describe, it, expect, vi, beforeEach } from "vitest";
import * as cmds from "@/lib/tauri-commands";

// The underlying invoke is mocked globally in setup.ts.
// These tests verify the command wrappers pass correct arguments.

let mockInvoke: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  const mod = await import("@tauri-apps/api/core");
  mockInvoke = mod.invoke as ReturnType<typeof vi.fn>;
  mockInvoke.mockReset();
  mockInvoke.mockResolvedValue(undefined);
});

describe("tauri-commands", () => {
  // ── Recording ─────────────────────────────────────────────

  describe("recording commands", () => {
    it("startRecording calls invoke with correct command", async () => {
      await cmds.startRecording();
      expect(mockInvoke).toHaveBeenCalledWith("start_recording", undefined);
    });

    it("stopRecording calls invoke with correct command", async () => {
      mockInvoke.mockResolvedValue({
        sessionId: "s1",
        durationMs: 1000,
        sampleCount: 16000,
      });
      const result = await cmds.stopRecording();
      expect(mockInvoke).toHaveBeenCalledWith("stop_recording", undefined);
      expect(result.sessionId).toBe("s1");
    });

    it("showRecordingBar calls correct command", async () => {
      await cmds.showRecordingBar();
      expect(mockInvoke).toHaveBeenCalledWith("show_recording_bar", undefined);
    });

    it("hideRecordingBar calls correct command", async () => {
      await cmds.hideRecordingBar();
      expect(mockInvoke).toHaveBeenCalledWith("hide_recording_bar", undefined);
    });
  });

  // ── Transcription ─────────────────────────────────────────

  describe("transcription commands", () => {
    it("transcribe sends correct params", async () => {
      mockInvoke.mockResolvedValue({
        text: "Hello",
        language: "en",
        segments: [],
        durationMs: 1000,
      });
      const result = await cmds.transcribe("session-1", "whisper-base", "en");
      expect(mockInvoke).toHaveBeenCalledWith("transcribe", {
        sessionId: "session-1",
        modelId: "whisper-base",
        language: "en",
      });
      expect(result.text).toBe("Hello");
    });

    it("transcribe works without language param", async () => {
      mockInvoke.mockResolvedValue({
        text: "Hi",
        language: null,
        segments: [],
        durationMs: 500,
      });
      await cmds.transcribe("s1", "whisper-tiny");
      expect(mockInvoke).toHaveBeenCalledWith("transcribe", {
        sessionId: "s1",
        modelId: "whisper-tiny",
        language: undefined,
      });
    });

    it("transcribeFile sends correct params", async () => {
      mockInvoke.mockResolvedValue({
        text: "File text",
        language: "en",
        segments: [],
        durationMs: 2000,
      });
      await cmds.transcribeFile("/path/to/file.wav", "whisper-base", "en");
      expect(mockInvoke).toHaveBeenCalledWith("transcribe_file", {
        path: "/path/to/file.wav",
        modelId: "whisper-base",
        language: "en",
      });
    });
  });

  // ── Clipboard ─────────────────────────────────────────────

  describe("clipboard commands", () => {
    it("pasteText sends text", async () => {
      await cmds.pasteText("Hello world");
      expect(mockInvoke).toHaveBeenCalledWith("paste_text", {
        text: "Hello world",
      });
    });
  });

  // ── Models ────────────────────────────────────────────────

  describe("model commands", () => {
    it("listModels calls correct command", async () => {
      mockInvoke.mockResolvedValue([
        { id: "whisper-base", name: "Whisper Base", downloaded: true },
      ]);
      const result = await cmds.listModels();
      expect(mockInvoke).toHaveBeenCalledWith("list_models", undefined);
      expect(result).toHaveLength(1);
    });

    it("downloadModel sends model ID", async () => {
      await cmds.downloadModel("whisper-base");
      expect(mockInvoke).toHaveBeenCalledWith("download_model", {
        modelId: "whisper-base",
      });
    });

    it("deleteModel sends model ID", async () => {
      await cmds.deleteModel("whisper-tiny");
      expect(mockInvoke).toHaveBeenCalledWith("delete_model", {
        modelId: "whisper-tiny",
      });
    });
  });

  // ── AI Functions ──────────────────────────────────────────

  describe("AI function commands", () => {
    it("listAiFunctions calls correct command", async () => {
      mockInvoke.mockResolvedValue([
        { id: "email", name: "Email", isBuiltin: true },
      ]);
      const result = await cmds.listAiFunctions();
      expect(mockInvoke).toHaveBeenCalledWith("list_ai_functions", undefined);
      expect(result[0].id).toBe("email");
    });

    it("executeAiFunction sends all params", async () => {
      mockInvoke.mockResolvedValue("Processed text");
      const result = await cmds.executeAiFunction({
        functionId: "email",
        text: "Hello",
        llmProvider: "openai",
        llmApiKey: "sk-test",
        llmModel: "gpt-4",
      });
      expect(mockInvoke).toHaveBeenCalledWith("execute_ai_function", {
        functionId: "email",
        text: "Hello",
        llmProvider: "openai",
        llmApiKey: "sk-test",
        llmModel: "gpt-4",
      });
      expect(result).toBe("Processed text");
    });
  });

  // ── Rules ─────────────────────────────────────────────────

  describe("rules commands", () => {
    it("applyRules sends text and rule IDs", async () => {
      mockInvoke.mockResolvedValue("Cleaned text");
      const result = await cmds.applyRules("um hello", ["remove-fillers"]);
      expect(mockInvoke).toHaveBeenCalledWith("apply_rules", {
        text: "um hello",
        enabledRuleIds: ["remove-fillers"],
      });
      expect(result).toBe("Cleaned text");
    });
  });

  // ── History ───────────────────────────────────────────────

  describe("history commands", () => {
    it("getHistory sends default params", async () => {
      mockInvoke.mockResolvedValue([]);
      await cmds.getHistory();
      expect(mockInvoke).toHaveBeenCalledWith("get_history", {
        limit: 100,
        offset: 0,
      });
    });

    it("getHistory sends custom params", async () => {
      mockInvoke.mockResolvedValue([]);
      await cmds.getHistory(50, 10);
      expect(mockInvoke).toHaveBeenCalledWith("get_history", {
        limit: 50,
        offset: 10,
      });
    });

    it("searchHistory sends query", async () => {
      mockInvoke.mockResolvedValue([]);
      await cmds.searchHistory("hello");
      expect(mockInvoke).toHaveBeenCalledWith("search_history", {
        query: "hello",
      });
    });

    it("getHistoryItem sends ID", async () => {
      mockInvoke.mockResolvedValue({ id: "h1", transcript: "Hi" });
      await cmds.getHistoryItem("h1");
      expect(mockInvoke).toHaveBeenCalledWith("get_history_item", { id: "h1" });
    });

    it("deleteHistoryItem sends ID", async () => {
      await cmds.deleteHistoryItem("h1");
      expect(mockInvoke).toHaveBeenCalledWith("delete_history_item", {
        id: "h1",
      });
    });

    it("saveHistoryItem sends all params", async () => {
      await cmds.saveHistoryItem({
        sessionId: "s1",
        transcript: "Hello",
        processedText: "Hello!",
        modelId: "whisper-base",
        language: "en",
        aiFunction: "email",
        durationMs: 5000,
      });
      expect(mockInvoke).toHaveBeenCalledWith("save_history_item", {
        sessionId: "s1",
        transcript: "Hello",
        processedText: "Hello!",
        modelId: "whisper-base",
        language: "en",
        aiFunction: "email",
        durationMs: 5000,
      });
    });

    it("saveHistoryItem handles null optional params", async () => {
      await cmds.saveHistoryItem({
        sessionId: "s1",
        transcript: "Hello",
        modelId: "whisper-base",
      });
      expect(mockInvoke).toHaveBeenCalledWith("save_history_item", {
        sessionId: "s1",
        transcript: "Hello",
        modelId: "whisper-base",
      });
    });
  });

  // ── Vocabulary ────────────────────────────────────────────

  describe("vocabulary commands", () => {
    it("getVocabulary calls correct command", async () => {
      mockInvoke.mockResolvedValue([{ id: "v1", term: "SobottaAI" }]);
      const result = await cmds.getVocabulary();
      expect(mockInvoke).toHaveBeenCalledWith("get_vocabulary", undefined);
      expect(result[0].term).toBe("SobottaAI");
    });

    it("addTerm sends term", async () => {
      await cmds.addTerm("GPT-4");
      expect(mockInvoke).toHaveBeenCalledWith("add_term", { term: "GPT-4" });
    });

    it("deleteTerm sends ID", async () => {
      await cmds.deleteTerm("v1");
      expect(mockInvoke).toHaveBeenCalledWith("delete_term", { id: "v1" });
    });
  });

  // ── Audio Import ──────────────────────────────────────────

  describe("audio import commands", () => {
    it("importAudioFile sends path", async () => {
      mockInvoke.mockResolvedValue("session-abc");
      const result = await cmds.importAudioFile("/path/to/audio.wav");
      expect(mockInvoke).toHaveBeenCalledWith("import_audio_file", {
        path: "/path/to/audio.wav",
      });
      expect(result).toBe("session-abc");
    });
  });
});

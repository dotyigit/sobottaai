import type {
  CheckOptions,
  DownloadEvent as UpdaterDownloadEvent,
  Update,
} from "@tauri-apps/plugin-updater";

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(cmd, args);
}

// ── Recording ──────────────────────────────────────────────

export interface StopResult {
  sessionId: string;
  durationMs: number;
  sampleCount: number;
}

export function startRecording(): Promise<void> {
  return invoke("start_recording");
}

export function stopRecording(): Promise<StopResult> {
  return invoke("stop_recording");
}

export function showRecordingBar(): Promise<void> {
  return invoke("show_recording_bar");
}

export function hideRecordingBar(): Promise<void> {
  return invoke("hide_recording_bar");
}

// ── Transcription ──────────────────────────────────────────

export interface TranscriptionResult {
  text: string;
  language: string | null;
  segments: { startMs: number; endMs: number; text: string }[];
  durationMs: number;
}

export function transcribe(
  sessionId: string,
  modelId: string,
  language?: string,
): Promise<TranscriptionResult> {
  return invoke("transcribe", { sessionId, modelId, language });
}

export function transcribeFile(
  path: string,
  modelId: string,
  language?: string,
): Promise<TranscriptionResult> {
  return invoke("transcribe_file", { path, modelId, language });
}

// ── Clipboard ──────────────────────────────────────────────

export function pasteText(text: string): Promise<void> {
  return invoke("paste_text", { text });
}

// ── Audio Import ───────────────────────────────────────────

export function importAudioFile(path: string): Promise<string> {
  return invoke("import_audio_file", { path });
}

// ── Models ─────────────────────────────────────────────────

export interface ModelInfo {
  id: string;
  name: string;
  engine: string;
  sizeMb: number;
  languageSupport: string;
  downloaded: boolean;
}

export function listModels(): Promise<ModelInfo[]> {
  return invoke("list_models");
}

export function downloadModel(modelId: string): Promise<void> {
  return invoke("download_model", { modelId });
}

export function deleteModel(modelId: string): Promise<void> {
  return invoke("delete_model", { modelId });
}

// ── AI Functions ───────────────────────────────────────────

export interface AiFunction {
  id: string;
  name: string;
  prompt: string;
  provider: string;
  model?: string;
  isBuiltin: boolean;
}

export function listAiFunctions(): Promise<AiFunction[]> {
  return invoke("list_ai_functions");
}

export function executeAiFunction(params: {
  functionId: string;
  text: string;
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;
}): Promise<string> {
  return invoke("execute_ai_function", params);
}

// ── Rules ─────────────────────────────────────────────────

export function applyRules(text: string, enabledRuleIds: string[]): Promise<string> {
  return invoke("apply_rules", { text, enabledRuleIds });
}

// ── History ────────────────────────────────────────────────

export interface HistoryItem {
  id: string;
  audioPath?: string;
  transcript: string;
  processedText?: string;
  modelId: string;
  language?: string;
  aiFunction?: string;
  durationMs?: number;
  createdAt: string;
}

export function getHistory(limit = 100, offset = 0): Promise<HistoryItem[]> {
  return invoke("get_history", { limit, offset });
}

export function searchHistory(query: string): Promise<HistoryItem[]> {
  return invoke("search_history", { query });
}

export function getHistoryItem(id: string): Promise<HistoryItem> {
  return invoke("get_history_item", { id });
}

export function deleteHistoryItem(id: string): Promise<void> {
  return invoke("delete_history_item", { id });
}

export function saveHistoryItem(params: {
  sessionId: string;
  transcript: string;
  processedText?: string | null;
  modelId: string;
  language?: string | null;
  aiFunction?: string | null;
  durationMs?: number | null;
}): Promise<void> {
  return invoke("save_history_item", params);
}

// ── Vocabulary ─────────────────────────────────────────────

export function getVocabulary(): Promise<{ id: string; term: string }[]> {
  return invoke("get_vocabulary");
}

export function addTerm(term: string): Promise<void> {
  return invoke("add_term", { term });
}

export function deleteTerm(id: string): Promise<void> {
  return invoke("delete_term", { id });
}

// ── App / Updater ───────────────────────────────────────────

export function restartApp(): Promise<void> {
  return invoke("restart_app");
}

export async function getAppVersion(): Promise<string> {
  const { getVersion } = await import("@tauri-apps/api/app");
  return getVersion();
}

export function checkForUpdate(options?: CheckOptions): Promise<Update | null> {
  return import("@tauri-apps/plugin-updater").then(({ check }) => check(options));
}

export type { Update, UpdaterDownloadEvent };

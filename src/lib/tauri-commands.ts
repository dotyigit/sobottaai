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

export function executeAiFunction(
  functionId: string,
  text: string,
): Promise<string> {
  return invoke("execute_ai_function", { functionId, text });
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

export function getHistory(): Promise<HistoryItem[]> {
  return invoke("get_history");
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

export function saveHistoryItem(item: {
  id: string;
  transcript: string;
  processedText?: string;
  modelId: string;
  language?: string;
  aiFunction?: string;
  durationMs?: number;
}): Promise<void> {
  return invoke("save_history_item", { item });
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

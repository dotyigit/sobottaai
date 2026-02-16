import { create } from "zustand";

interface Rule {
  id: string;
  name: string;
  enabled: boolean;
}

interface SettingsState {
  selectedModel: string;
  selectedLanguage: string;
  selectedAiFunction: string | null;
  recordingMode: "push-to-talk" | "toggle";
  rules: Rule[];
  defaultHotkey: string;
  theme: "light" | "dark" | "system";
  launchAtLogin: boolean;
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;
  _hydrated: boolean;
  setSelectedModel: (model: string) => void;
  setSelectedLanguage: (lang: string) => void;
  setSelectedAiFunction: (fn: string | null) => void;
  setRecordingMode: (mode: "push-to-talk" | "toggle") => void;
  toggleRule: (ruleId: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setLaunchAtLogin: (value: boolean) => void;
  setLlmProvider: (provider: string) => void;
  setLlmApiKey: (key: string) => void;
  setLlmModel: (model: string) => void;
  hydrate: () => Promise<void>;
}

const STORE_KEY = "settings";

// Persist to tauri-plugin-store
async function persistSettings(state: Partial<SettingsState>) {
  try {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load("settings.json");
    // Only save serializable fields
    const { _hydrated, ...rest } = state as Record<string, unknown>;
    // Filter out functions
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (typeof value !== "function") {
        data[key] = value;
      }
    }
    await store.set(STORE_KEY, data);
    await store.save();
  } catch {
    // Outside Tauri context
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  selectedModel: "whisper-base",
  selectedLanguage: "auto",
  selectedAiFunction: null,
  recordingMode: "push-to-talk",
  rules: [
    { id: "remove-fillers", name: "Remove Filler Words", enabled: false },
    { id: "smart-punctuation", name: "Smart Punctuation", enabled: false },
    { id: "fix-grammar", name: "Fix Grammar", enabled: false },
  ],
  defaultHotkey: "CommandOrControl+Shift+Space",
  theme: "system",
  launchAtLogin: false,
  llmProvider: "openai",
  llmApiKey: "",
  llmModel: "gpt-4o-mini",
  _hydrated: false,

  setSelectedModel: (model) => {
    set({ selectedModel: model });
    persistSettings(get());
  },
  setSelectedLanguage: (lang) => {
    set({ selectedLanguage: lang });
    persistSettings(get());
  },
  setSelectedAiFunction: (fn) => {
    set({ selectedAiFunction: fn });
    persistSettings(get());
  },
  setRecordingMode: (mode) => {
    set({ recordingMode: mode });
    persistSettings(get());
  },
  toggleRule: (ruleId) => {
    set((state) => ({
      rules: state.rules.map((r) =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      ),
    }));
    persistSettings(get());
  },
  setTheme: (theme) => {
    set({ theme });
    persistSettings(get());
  },
  setLaunchAtLogin: (value) => {
    set({ launchAtLogin: value });
    persistSettings(get());
  },
  setLlmProvider: (provider) => {
    set({ llmProvider: provider });
    persistSettings(get());
  },
  setLlmApiKey: (key) => {
    set({ llmApiKey: key });
    persistSettings(get());
  },
  setLlmModel: (model) => {
    set({ llmModel: model });
    persistSettings(get());
  },

  hydrate: async () => {
    try {
      const { load } = await import("@tauri-apps/plugin-store");
      const store = await load("settings.json");
      const data = await store.get<Record<string, unknown>>(STORE_KEY);
      if (data) {
        set({
          selectedModel: (data.selectedModel as string) ?? "whisper-base",
          selectedLanguage: (data.selectedLanguage as string) ?? "auto",
          selectedAiFunction: (data.selectedAiFunction as string | null) ?? null,
          recordingMode: (data.recordingMode as "push-to-talk" | "toggle") ?? "push-to-talk",
          rules: (data.rules as Rule[]) ?? [
            { id: "remove-fillers", name: "Remove Filler Words", enabled: false },
            { id: "smart-punctuation", name: "Smart Punctuation", enabled: false },
            { id: "fix-grammar", name: "Fix Grammar", enabled: false },
          ],
          theme: (data.theme as "light" | "dark" | "system") ?? "system",
          launchAtLogin: (data.launchAtLogin as boolean) ?? false,
          llmProvider: (data.llmProvider as string) ?? "openai",
          llmApiKey: (data.llmApiKey as string) ?? "",
          llmModel: (data.llmModel as string) ?? "gpt-4o-mini",
          _hydrated: true,
        });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));

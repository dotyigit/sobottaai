import { create } from "zustand";

interface Rule {
  id: string;
  name: string;
  enabled: boolean;
}

interface ProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
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
  providerConfigs: Record<string, ProviderConfig>;
  onboardingComplete: boolean;
  _hydrated: boolean;
  setOnboardingComplete: (value: boolean) => void;
  setSelectedModel: (model: string) => void;
  setSelectedLanguage: (lang: string) => void;
  setSelectedAiFunction: (fn: string | null) => void;
  setRecordingMode: (mode: "push-to-talk" | "toggle") => void;
  toggleRule: (ruleId: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setLaunchAtLogin: (value: boolean) => void;
  setDefaultHotkey: (hotkey: string) => void;
  setLlmProvider: (provider: string) => void;
  setProviderConfig: (provider: string, config: Partial<ProviderConfig>) => void;
  // Convenience getters for the active provider
  get llmApiKey(): string;
  get llmModel(): string;
  hydrate: () => Promise<void>;
}

const DEFAULT_PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: { apiKey: "", model: "gpt-4o-mini" },
  anthropic: { apiKey: "", model: "claude-sonnet-4-5-20250929" },
  groq: { apiKey: "", model: "llama-3.3-70b-versatile" },
  ollama: { apiKey: "", model: "llama3.2", baseUrl: "http://localhost:11434" },
};

const STORE_KEY = "settings";

async function persistSettings(state: Partial<SettingsState>) {
  try {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load("settings.json");
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(state)) {
      if (typeof value !== "function" && key !== "_hydrated") {
        data[key] = value;
      }
    }
    await store.set(STORE_KEY, data);
    await store.save();
  } catch {
    // Outside Tauri context
  }
}

async function setAutostart(enabled: boolean) {
  try {
    if (enabled) {
      const { enable } = await import("@tauri-apps/plugin-autostart");
      await enable();
    } else {
      const { disable } = await import("@tauri-apps/plugin-autostart");
      await disable();
    }
  } catch {
    // Outside Tauri context
  }
}

async function updateHotkeyBackend(hotkey: string) {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("update_hotkey", { hotkey });
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
  providerConfigs: { ...DEFAULT_PROVIDER_CONFIGS },
  onboardingComplete: false,
  _hydrated: false,

  get llmApiKey() {
    const state = get();
    return state.providerConfigs[state.llmProvider]?.apiKey ?? "";
  },

  get llmModel() {
    const state = get();
    return state.providerConfigs[state.llmProvider]?.model ?? "";
  },

  setOnboardingComplete: (value) => {
    set({ onboardingComplete: value });
    persistSettings(get());
  },
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
    setAutostart(value);
    persistSettings(get());
  },
  setDefaultHotkey: (hotkey) => {
    set({ defaultHotkey: hotkey });
    updateHotkeyBackend(hotkey);
    persistSettings(get());
  },
  setLlmProvider: (provider) => {
    set({ llmProvider: provider });
    persistSettings(get());
  },
  setProviderConfig: (provider, config) => {
    set((state) => ({
      providerConfigs: {
        ...state.providerConfigs,
        [provider]: {
          ...state.providerConfigs[provider],
          ...config,
        },
      },
    }));
    persistSettings(get());
  },

  hydrate: async () => {
    try {
      const { load } = await import("@tauri-apps/plugin-store");
      const store = await load("settings.json");
      const data = await store.get<Record<string, unknown>>(STORE_KEY);
      if (data) {
        // Migrate old single-key format to per-provider configs
        let providerConfigs = data.providerConfigs as Record<string, ProviderConfig> | undefined;
        if (!providerConfigs) {
          providerConfigs = { ...DEFAULT_PROVIDER_CONFIGS };
          // Migrate old llmApiKey/llmModel if present
          const oldProvider = (data.llmProvider as string) ?? "openai";
          const oldKey = (data.llmApiKey as string) ?? "";
          const oldModel = (data.llmModel as string) ?? "";
          if (oldKey && providerConfigs[oldProvider]) {
            providerConfigs[oldProvider].apiKey = oldKey;
          }
          if (oldModel && providerConfigs[oldProvider]) {
            providerConfigs[oldProvider].model = oldModel;
          }
        }

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
          defaultHotkey: (data.defaultHotkey as string) ?? "CommandOrControl+Shift+Space",
          theme: (data.theme as "light" | "dark" | "system") ?? "system",
          launchAtLogin: (data.launchAtLogin as boolean) ?? false,
          llmProvider: (data.llmProvider as string) ?? "openai",
          providerConfigs: { ...DEFAULT_PROVIDER_CONFIGS, ...providerConfigs },
          onboardingComplete: (data.onboardingComplete as boolean) ?? false,
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

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
}

export const useSettingsStore = create<SettingsState>((set) => ({
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
  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
  setSelectedAiFunction: (fn) => set({ selectedAiFunction: fn }),
  setRecordingMode: (mode) => set({ recordingMode: mode }),
  toggleRule: (ruleId) =>
    set((state) => ({
      rules: state.rules.map((r) =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      ),
    })),
  setTheme: (theme) => set({ theme }),
  setLaunchAtLogin: (value) => set({ launchAtLogin: value }),
  setLlmProvider: (provider) => set({ llmProvider: provider }),
  setLlmApiKey: (key) => set({ llmApiKey: key }),
  setLlmModel: (model) => set({ llmModel: model }),
}));

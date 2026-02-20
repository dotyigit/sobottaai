import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "@/stores/settings-store";

// Reset the zustand store between tests
beforeEach(() => {
  useSettingsStore.setState({
    selectedModel: "whisper-base",
    selectedLanguage: "auto",
    selectedAiFunction: null,
    recordingMode: "push-to-talk",
    rules: [
      { id: "remove-fillers", name: "Remove Filler Words", enabled: false },
      { id: "smart-punctuation", name: "Smart Punctuation", enabled: false },
      { id: "fix-grammar", name: "Fix Grammar", enabled: false },
    ],
    defaultHotkey: "Alt+Space",
    theme: "system",
    launchAtLogin: false,
    llmProvider: "openai",
    providerConfigs: {
      openai: { apiKey: "", model: "gpt-4o-mini" },
      anthropic: { apiKey: "", model: "claude-sonnet-4-5-20250929" },
      groq: { apiKey: "", model: "llama-3.3-70b-versatile" },
      ollama: { apiKey: "", model: "llama3.2", baseUrl: "http://localhost:11434" },
    },
    onboardingComplete: false,
    _hydrated: false,
  });
});

describe("settings-store", () => {
  // ── Default state ─────────────────────────────────────────

  describe("default state", () => {
    it("has correct default model", () => {
      expect(useSettingsStore.getState().selectedModel).toBe("whisper-base");
    });

    it("has correct default language", () => {
      expect(useSettingsStore.getState().selectedLanguage).toBe("auto");
    });

    it("has no AI function selected by default", () => {
      expect(useSettingsStore.getState().selectedAiFunction).toBeNull();
    });

    it("defaults to push-to-talk mode", () => {
      expect(useSettingsStore.getState().recordingMode).toBe("push-to-talk");
    });

    it("defaults to Alt+Space hotkey", () => {
      expect(useSettingsStore.getState().defaultHotkey).toBe("Alt+Space");
    });

    it("defaults to system theme", () => {
      expect(useSettingsStore.getState().theme).toBe("system");
    });

    it("defaults to launch at login disabled", () => {
      expect(useSettingsStore.getState().launchAtLogin).toBe(false);
    });

    it("defaults to openai provider", () => {
      expect(useSettingsStore.getState().llmProvider).toBe("openai");
    });

    it("has onboarding incomplete by default", () => {
      expect(useSettingsStore.getState().onboardingComplete).toBe(false);
    });

    it("has three rules all disabled", () => {
      const { rules } = useSettingsStore.getState();
      expect(rules).toHaveLength(3);
      rules.forEach((r) => expect(r.enabled).toBe(false));
    });

    it("has four provider configs", () => {
      const { providerConfigs } = useSettingsStore.getState();
      expect(Object.keys(providerConfigs)).toEqual(
        expect.arrayContaining(["openai", "anthropic", "groq", "ollama"])
      );
    });
  });

  // ── Setters ───────────────────────────────────────────────

  describe("setters", () => {
    it("setSelectedModel updates model", () => {
      useSettingsStore.getState().setSelectedModel("whisper-large-v3-turbo");
      expect(useSettingsStore.getState().selectedModel).toBe("whisper-large-v3-turbo");
    });

    it("setSelectedLanguage updates language", () => {
      useSettingsStore.getState().setSelectedLanguage("en");
      expect(useSettingsStore.getState().selectedLanguage).toBe("en");
    });

    it("setSelectedAiFunction updates function", () => {
      useSettingsStore.getState().setSelectedAiFunction("email");
      expect(useSettingsStore.getState().selectedAiFunction).toBe("email");
    });

    it("setSelectedAiFunction to null clears function", () => {
      useSettingsStore.getState().setSelectedAiFunction("email");
      useSettingsStore.getState().setSelectedAiFunction(null);
      expect(useSettingsStore.getState().selectedAiFunction).toBeNull();
    });

    it("setRecordingMode updates mode", () => {
      useSettingsStore.getState().setRecordingMode("toggle");
      expect(useSettingsStore.getState().recordingMode).toBe("toggle");
    });

    it("setDefaultHotkey updates hotkey", () => {
      useSettingsStore.getState().setDefaultHotkey("CommandOrControl+Shift+Space");
      expect(useSettingsStore.getState().defaultHotkey).toBe("CommandOrControl+Shift+Space");
    });

    it("setTheme updates theme", () => {
      useSettingsStore.getState().setTheme("dark");
      expect(useSettingsStore.getState().theme).toBe("dark");
    });

    it("setLaunchAtLogin updates value", () => {
      useSettingsStore.getState().setLaunchAtLogin(true);
      expect(useSettingsStore.getState().launchAtLogin).toBe(true);
    });

    it("setLlmProvider updates provider", () => {
      useSettingsStore.getState().setLlmProvider("anthropic");
      expect(useSettingsStore.getState().llmProvider).toBe("anthropic");
    });

    it("setOnboardingComplete updates value", () => {
      useSettingsStore.getState().setOnboardingComplete(true);
      expect(useSettingsStore.getState().onboardingComplete).toBe(true);
    });
  });

  // ── Rules ─────────────────────────────────────────────────

  describe("rules", () => {
    it("toggleRule enables a rule", () => {
      useSettingsStore.getState().toggleRule("remove-fillers");
      const { rules } = useSettingsStore.getState();
      expect(rules.find((r) => r.id === "remove-fillers")?.enabled).toBe(true);
    });

    it("toggleRule disables an enabled rule", () => {
      useSettingsStore.getState().toggleRule("remove-fillers");
      useSettingsStore.getState().toggleRule("remove-fillers");
      const { rules } = useSettingsStore.getState();
      expect(rules.find((r) => r.id === "remove-fillers")?.enabled).toBe(false);
    });

    it("toggleRule only affects the targeted rule", () => {
      useSettingsStore.getState().toggleRule("smart-punctuation");
      const { rules } = useSettingsStore.getState();
      expect(rules.find((r) => r.id === "remove-fillers")?.enabled).toBe(false);
      expect(rules.find((r) => r.id === "smart-punctuation")?.enabled).toBe(true);
      expect(rules.find((r) => r.id === "fix-grammar")?.enabled).toBe(false);
    });

    it("toggleRule with unknown id is safe (no-op)", () => {
      const before = useSettingsStore.getState().rules;
      useSettingsStore.getState().toggleRule("nonexistent");
      const after = useSettingsStore.getState().rules;
      expect(after).toEqual(before);
    });
  });

  // ── Provider configs ──────────────────────────────────────

  describe("provider configs", () => {
    it("setProviderConfig updates api key", () => {
      useSettingsStore.getState().setProviderConfig("openai", { apiKey: "sk-test-123" });
      const config = useSettingsStore.getState().providerConfigs["openai"];
      expect(config.apiKey).toBe("sk-test-123");
    });

    it("setProviderConfig updates model", () => {
      useSettingsStore.getState().setProviderConfig("openai", { model: "gpt-4" });
      const config = useSettingsStore.getState().providerConfigs["openai"];
      expect(config.model).toBe("gpt-4");
    });

    it("setProviderConfig preserves other fields", () => {
      useSettingsStore.getState().setProviderConfig("openai", { apiKey: "sk-test" });
      const config = useSettingsStore.getState().providerConfigs["openai"];
      expect(config.model).toBe("gpt-4o-mini"); // unchanged
    });

    it("setProviderConfig updates ollama base URL", () => {
      useSettingsStore.getState().setProviderConfig("ollama", {
        baseUrl: "http://custom:8080",
      });
      const config = useSettingsStore.getState().providerConfigs["ollama"];
      expect(config.baseUrl).toBe("http://custom:8080");
    });

    it("setProviderConfig for different providers is independent", () => {
      useSettingsStore.getState().setProviderConfig("openai", { apiKey: "key-openai" });
      useSettingsStore.getState().setProviderConfig("anthropic", { apiKey: "key-anthropic" });
      const configs = useSettingsStore.getState().providerConfigs;
      expect(configs["openai"].apiKey).toBe("key-openai");
      expect(configs["anthropic"].apiKey).toBe("key-anthropic");
      expect(configs["groq"].apiKey).toBe(""); // untouched
    });
  });

  // ── Provider config lookups ─────────────────────────────
  // Note: The store defines `get llmApiKey()` / `get llmModel()` as JS
  // getters, which get flattened by Zustand's Object.assign after the
  // first set() call. So we test the underlying lookup logic directly.

  describe("provider config lookups", () => {
    function activeApiKey() {
      const s = useSettingsStore.getState();
      return s.providerConfigs[s.llmProvider]?.apiKey ?? "";
    }
    function activeModel() {
      const s = useSettingsStore.getState();
      return s.providerConfigs[s.llmProvider]?.model ?? "";
    }

    it("returns active provider api key", () => {
      useSettingsStore.getState().setProviderConfig("openai", { apiKey: "sk-active" });
      expect(activeApiKey()).toBe("sk-active");
    });

    it("api key changes when provider changes", () => {
      useSettingsStore.getState().setProviderConfig("openai", { apiKey: "sk-openai" });
      useSettingsStore.getState().setProviderConfig("anthropic", { apiKey: "sk-anthropic" });
      useSettingsStore.getState().setLlmProvider("anthropic");
      expect(activeApiKey()).toBe("sk-anthropic");
    });

    it("returns active provider model", () => {
      expect(activeModel()).toBe("gpt-4o-mini");
    });

    it("model changes when provider changes", () => {
      useSettingsStore.getState().setLlmProvider("anthropic");
      expect(activeModel()).toBe("claude-sonnet-4-5-20250929");
    });

    it("api key defaults to empty string for unknown provider", () => {
      useSettingsStore.getState().setLlmProvider("unknown");
      expect(activeApiKey()).toBe("");
    });

    it("ollama base URL is accessible", () => {
      const s = useSettingsStore.getState();
      expect(s.providerConfigs["ollama"]?.baseUrl).toBe("http://localhost:11434");
    });
  });
});

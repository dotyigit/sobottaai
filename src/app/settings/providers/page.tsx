"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    placeholder: "sk-...",
    defaultModel: "gpt-4o-mini",
    needsKey: true,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    placeholder: "sk-ant-...",
    defaultModel: "claude-sonnet-4-5-20250929",
    needsKey: true,
  },
  {
    id: "groq",
    name: "Groq",
    placeholder: "gsk_...",
    defaultModel: "llama-3.3-70b-versatile",
    needsKey: true,
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    placeholder: "Not required",
    defaultModel: "llama3.2",
    needsKey: false,
  },
];

export default function ProviderSettings() {
  const { llmProvider, setLlmProvider, providerConfigs, setProviderConfig } =
    useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">API Keys</h3>
        <p className="text-sm text-muted-foreground">
          Configure API keys for LLM providers used by AI Functions and grammar
          correction. Keys are stored locally and never shared.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Default Provider</Label>
        <Select value={llmProvider} onValueChange={setLlmProvider}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROVIDERS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Used for AI Functions and grammar correction rules.
        </p>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const config = providerConfigs[provider.id] ?? {
            apiKey: "",
            model: provider.defaultModel,
          };
          const isActive = llmProvider === provider.id;

          return (
            <div
              key={provider.id}
              className={`rounded-lg border p-4 space-y-3 ${
                isActive ? "border-primary/50 bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{provider.name}</span>
                {isActive && <Badge>Active</Badge>}
              </div>

              {provider.needsKey && (
                <div className="space-y-1">
                  <Label className="text-xs">API Key</Label>
                  <Input
                    type="password"
                    placeholder={provider.placeholder}
                    value={config.apiKey}
                    onChange={(e) =>
                      setProviderConfig(provider.id, { apiKey: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Model</Label>
                <Input
                  placeholder={provider.defaultModel}
                  value={config.model}
                  onChange={(e) =>
                    setProviderConfig(provider.id, { model: e.target.value })
                  }
                />
              </div>

              {provider.id === "ollama" && (
                <div className="space-y-1">
                  <Label className="text-xs">Base URL</Label>
                  <Input
                    placeholder="http://localhost:11434"
                    value={config.baseUrl ?? ""}
                    onChange={(e) =>
                      setProviderConfig(provider.id, {
                        baseUrl: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

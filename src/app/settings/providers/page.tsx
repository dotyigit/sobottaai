"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";

export default function ProviderSettings() {
  const {
    llmProvider,
    setLlmProvider,
    llmApiKey,
    setLlmApiKey,
    llmModel,
    setLlmModel,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">API Keys</h3>
        <p className="text-sm text-muted-foreground">
          Configure API keys for LLM providers. Keys are stored locally and never shared.
          All providers are optional.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Default LLM Provider</Label>
          <Select value={llmProvider} onValueChange={setLlmProvider}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="ollama">Ollama (Local)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>API Key</Label>
          <Input
            type="password"
            placeholder={llmProvider === "ollama" ? "Not required for Ollama" : "Enter API key..."}
            value={llmApiKey}
            onChange={(e) => setLlmApiKey(e.target.value)}
            disabled={llmProvider === "ollama"}
          />
        </div>

        <div className="space-y-2">
          <Label>Model</Label>
          <Input
            placeholder="e.g., gpt-4o-mini"
            value={llmModel}
            onChange={(e) => setLlmModel(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

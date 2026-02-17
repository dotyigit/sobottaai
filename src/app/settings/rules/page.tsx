"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settings-store";

const RULE_DESCRIPTIONS: Record<string, string> = {
  "remove-fillers":
    'Removes filler words like "um", "uh", "like", "you know" from transcriptions.',
  "smart-punctuation":
    "Cleans up punctuation — normalizes spaces around periods, commas, and question marks.",
  "fix-grammar":
    "Uses your configured LLM provider to fix grammar and improve clarity. Requires an API key.",
};

export default function RulesSettings() {
  const { rules, toggleRule } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Text Processing Rules</h3>
        <p className="text-sm text-muted-foreground">
          Toggle rules that apply to every transcription. Rules stack and run in
          order.
        </p>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-start justify-between rounded-lg border p-4"
          >
            <div className="space-y-1">
              <Label>{rule.name}</Label>
              {RULE_DESCRIPTIONS[rule.id] && (
                <p className="text-sm text-muted-foreground">
                  {RULE_DESCRIPTIONS[rule.id]}
                </p>
              )}
            </div>
            <Switch
              checked={rule.enabled}
              onCheckedChange={() => toggleRule(rule.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

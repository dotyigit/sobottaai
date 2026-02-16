"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settings-store";

export default function RulesSettings() {
  const { rules, toggleRule } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Text Processing Rules</h3>
        <p className="text-sm text-muted-foreground">
          Toggle rules that apply to every transcription. Rules stack together.
        </p>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between">
            <Label>{rule.name}</Label>
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

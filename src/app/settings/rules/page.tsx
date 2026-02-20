"use client";

import { Filter, Type } from "lucide-react";
import { motion } from "motion/react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";

const RULE_META: Record<string, { icon: typeof Filter; description: string }> = {
  "remove-fillers": {
    icon: Filter,
    description:
      'Removes filler words like "um", "uh", "like", "you know" from transcriptions.',
  },
  "smart-punctuation": {
    icon: Type,
    description:
      "Cleans up punctuation \u2014 normalizes spaces around periods, commas, and question marks.",
  },
};

export default function RulesSettings() {
  const { rules, toggleRule } = useSettingsStore();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Text Processing Rules</h3>
        <p className="text-sm text-muted-foreground">
          Rules apply to every transcription in the order shown below.
        </p>
      </div>

      <div className="space-y-2">
        {rules.map((rule, index) => {
          const meta = RULE_META[rule.id];
          const Icon = meta?.icon ?? Filter;

          return (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                rule.enabled
                  ? "border-border bg-card/30"
                  : "border-border/50"
              )}
            >
              {/* Icon with step number */}
              <div
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-lg shrink-0 transition-colors",
                  rule.enabled
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground/40"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <Label
                    className={cn(
                      "text-sm transition-colors",
                      !rule.enabled && "text-muted-foreground/50"
                    )}
                  >
                    {rule.name}
                  </Label>
                  <span
                    className={cn(
                      "text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded bg-muted/50 transition-colors",
                      rule.enabled
                        ? "text-muted-foreground"
                        : "text-muted-foreground/30"
                    )}
                  >
                    Step {index + 1}
                  </span>
                </div>
                {meta?.description && (
                  <p
                    className={cn(
                      "text-xs mt-1 leading-relaxed transition-colors",
                      rule.enabled
                        ? "text-muted-foreground"
                        : "text-muted-foreground/30"
                    )}
                  >
                    {meta.description}
                  </p>
                )}
              </div>

              {/* Switch */}
              <div className="shrink-0 pt-1">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={() => toggleRule(rule.id)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

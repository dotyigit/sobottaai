"use client";

import { Monitor, Sun, Moon, Power } from "lucide-react";
import { motion } from "motion/react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";

function SettingRow({
  icon: Icon,
  label,
  description,
  children,
  index = 0,
}: {
  icon: typeof Monitor;
  label: string;
  description: string;
  children: React.ReactNode;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between rounded-xl border p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted/50 text-muted-foreground shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <Label className="text-sm">{label}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

export default function GeneralSettings() {
  const { theme, setTheme, launchAtLogin, setLaunchAtLogin } =
    useSettingsStore();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">General</h3>
        <p className="text-sm text-muted-foreground">
          Configure general application settings.
        </p>
      </div>

      <div className="space-y-3">
        <SettingRow
          icon={Monitor}
          label="Theme"
          description="Choose your preferred appearance"
          index={0}
        >
          <ToggleGroup
            type="single"
            variant="outline"
            value={theme}
            onValueChange={(v) => {
              if (v) setTheme(v as "light" | "dark" | "system");
            }}
          >
            <ToggleGroupItem value="system" aria-label="System theme">
              <Monitor className="h-4 w-4 mr-1.5" />
              System
            </ToggleGroupItem>
            <ToggleGroupItem value="light" aria-label="Light theme">
              <Sun className="h-4 w-4 mr-1.5" />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Dark theme">
              <Moon className="h-4 w-4 mr-1.5" />
              Dark
            </ToggleGroupItem>
          </ToggleGroup>
        </SettingRow>

        <SettingRow
          icon={Power}
          label="Launch at Login"
          description="Automatically start SobottaAI when you log in"
          index={1}
        >
          <Switch checked={launchAtLogin} onCheckedChange={setLaunchAtLogin} />
        </SettingRow>
      </div>
    </div>
  );
}

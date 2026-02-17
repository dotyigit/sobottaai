"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";

export default function GeneralSettings() {
  const { theme, setTheme, launchAtLogin, setLaunchAtLogin } =
    useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">General</h3>
        <p className="text-sm text-muted-foreground">
          Configure general application settings.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>Theme</Label>
            <p className="text-sm text-muted-foreground">
              Choose your preferred appearance
            </p>
          </div>
          <Select
            value={theme}
            onValueChange={(v) =>
              setTheme(v as "light" | "dark" | "system")
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>Launch at Login</Label>
            <p className="text-sm text-muted-foreground">
              Automatically start SobottaAI when you log in
            </p>
          </div>
          <Switch checked={launchAtLogin} onCheckedChange={setLaunchAtLogin} />
        </div>
      </div>
    </div>
  );
}

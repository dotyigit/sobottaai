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

export default function HotkeySettings() {
  const { defaultHotkey, recordingMode, setRecordingMode } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Hotkeys</h3>
        <p className="text-sm text-muted-foreground">
          Configure keyboard shortcuts for recording.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Default Hotkey</Label>
          <Input value={defaultHotkey} readOnly className="font-mono" />
          <p className="text-xs text-muted-foreground">
            Hotkey customization coming in a future update.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Recording Mode</Label>
            <p className="text-sm text-muted-foreground">
              How the hotkey controls recording
            </p>
          </div>
          <Select
            value={recordingMode}
            onValueChange={(v) => setRecordingMode(v as "push-to-talk" | "toggle")}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="push-to-talk">Push to Talk</SelectItem>
              <SelectItem value="toggle">Toggle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

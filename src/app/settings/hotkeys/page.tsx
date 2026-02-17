"use client";

import { useState, useCallback, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";

const HOTKEY_PRESETS = [
  { value: "CommandOrControl+Shift+Space", label: "Cmd/Ctrl + Shift + Space" },
  { value: "CommandOrControl+Shift+H", label: "Cmd/Ctrl + Shift + H" },
  { value: "CommandOrControl+Shift+R", label: "Cmd/Ctrl + Shift + R" },
  { value: "Alt+Space", label: "Alt + Space" },
  { value: "F9", label: "F9" },
  { value: "F10", label: "F10" },
];

export default function HotkeySettings() {
  const { defaultHotkey, setDefaultHotkey, recordingMode, setRecordingMode } =
    useSettingsStore();
  const [recording, setRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!recording) return;
      e.preventDefault();
      e.stopPropagation();

      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push("CommandOrControl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");

      const key = e.key;
      // Only register if a non-modifier key is also pressed
      if (!["Control", "Shift", "Alt", "Meta"].includes(key)) {
        const keyName =
          key.length === 1 ? key.toUpperCase() : key.replace("Arrow", "");
        parts.push(keyName);
        const combo = parts.join("+");
        setRecordedKeys(combo);
        setRecording(false);
      }
    },
    [recording],
  );

  useEffect(() => {
    if (recording) {
      window.addEventListener("keydown", handleKeyDown, true);
      return () => window.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [recording, handleKeyDown]);

  function applyRecordedHotkey() {
    if (recordedKeys) {
      setDefaultHotkey(recordedKeys);
      setRecordedKeys(null);
    }
  }

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
          <Label>Recording Hotkey</Label>
          <Select value={defaultHotkey} onValueChange={setDefaultHotkey}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOTKEY_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRecording(true);
                setRecordedKeys(null);
              }}
            >
              {recording ? "Press a key combo..." : "Record Custom Hotkey"}
            </Button>
            {recordedKeys && (
              <>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {recordedKeys}
                </span>
                <Button size="sm" onClick={applyRecordedHotkey}>
                  Apply
                </Button>
              </>
            )}
          </div>
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
            onValueChange={(v) =>
              setRecordingMode(v as "push-to-talk" | "toggle")
            }
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

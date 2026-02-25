"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { KeyboardMusic, ToggleLeft, Circle, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { useIsMac, parseHotkeyKeys, getHotkeyPresets } from "@/lib/hotkey-utils";

/** Render a single keyboard key as a styled badge */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2.5 rounded-md border border-border bg-gradient-to-b from-muted/80 to-muted text-[11px] font-mono font-semibold shadow-[0_1px_0_1px_rgba(0,0,0,0.06)] text-foreground/80">
      {children}
    </span>
  );
}

export default function HotkeySettings() {
  const { defaultHotkey, setDefaultHotkey, recordingMode, setRecordingMode } =
    useSettingsStore();
  const [recording, setRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string | null>(null);
  const isMac = useIsMac();
  const presets = useMemo(() => getHotkeyPresets(isMac), [isMac]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!recording) return;
      e.preventDefault();
      e.stopPropagation();

      // Skip bare modifier keys — wait for the actual key
      const modifierCodes = ["ControlLeft", "ControlRight", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight"];
      if (modifierCodes.includes(e.code)) return;

      // Escape cancels recording
      if (e.code === "Escape") {
        setRecording(false);
        return;
      }

      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push("CommandOrControl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");

      // Use e.code for the physical key — e.key returns wrong chars
      // when modifiers are held (e.g. Option+K = ˚ on macOS)
      // e.code gives: KeyA, Digit1, Space, F1, ArrowUp, Enter, etc.
      // Tauri's parser accepts these directly
      parts.push(e.code);
      setRecordedKeys(parts.join("+"));
      setRecording(false);
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

  const isCustomHotkey = !presets.some((p) => p.value === defaultHotkey);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Hotkeys</h3>
        <p className="text-sm text-muted-foreground">
          Choose a keyboard shortcut to start and stop recording from anywhere.
        </p>
      </div>

      {/* Hotkey Preset Selection */}
      <div className="space-y-3">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recording Hotkey
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => {
            const isSelected = defaultHotkey === preset.value;
            const keys = parseHotkeyKeys(preset.value, isMac);
            return (
              <button
                key={preset.value}
                onClick={() => {
                  setDefaultHotkey(preset.value);
                  setRecordedKeys(null);
                }}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all",
                  isSelected
                    ? "border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20"
                    : "border-border hover:border-muted-foreground/30 hover:bg-accent/30"
                )}
              >
                {/* Radio indicator */}
                <div className="absolute top-3 right-3">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5, duration: 0.3 }}
                        className="h-1.5 w-1.5 rounded-full bg-primary-foreground"
                      />
                    )}
                  </div>
                </div>

                {/* Key badges */}
                <div className="flex items-center gap-1.5">
                  {keys.map((k, i) => (
                    <span key={i} className="contents">
                      {i > 0 && (
                        <span className="text-[10px] text-muted-foreground/50 font-medium">+</span>
                      )}
                      <Kbd>{k}</Kbd>
                    </span>
                  ))}
                </div>

                {/* Description */}
                <span className="text-[11px] text-muted-foreground">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Hotkey Recording */}
      <div className="space-y-3">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Or record a custom shortcut
        </Label>

        <AnimatePresence mode="wait">
          {recording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative"
            >
              <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/50 bg-primary/[0.03] p-6">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="h-2.5 w-2.5 rounded-full bg-primary"
                />
                <span className="text-sm font-medium text-primary">
                  Press your key combination...
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 text-xs text-muted-foreground"
                onClick={() => setRecording(false)}
              >
                Cancel
              </Button>
            </motion.div>
          ) : recordedKeys ? (
            <motion.div
              key="recorded"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4"
            >
              <div className="flex items-center gap-1.5">
                {parseHotkeyKeys(recordedKeys, isMac).map((k, i) => (
                  <span key={i} className="contents">
                    {i > 0 && (
                      <span className="text-[10px] text-muted-foreground/50 font-medium">+</span>
                    )}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button size="sm" onClick={applyRecordedHotkey} className="h-7 text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Apply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setRecordedKeys(null)}
                >
                  Discard
                </Button>
              </div>
            </motion.div>
          ) : isCustomHotkey ? (
            <motion.div
              key="active-custom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20 p-4"
            >
              <div className="flex items-center gap-1.5">
                {parseHotkeyKeys(defaultHotkey, isMac).map((k, i) => (
                  <span key={i} className="contents">
                    {i > 0 && (
                      <span className="text-[10px] text-muted-foreground/50 font-medium">+</span>
                    )}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">Custom shortcut</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs ml-auto"
                onClick={() => {
                  setRecording(true);
                  setRecordedKeys(null);
                }}
              >
                Change
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={() => {
                  setRecording(true);
                  setRecordedKeys(null);
                }}
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors"
              >
                <Circle className="h-3.5 w-3.5" />
                Record custom shortcut
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recording Mode */}
      <div className="space-y-3">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recording Mode
        </Label>
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="text-sm font-medium">How the hotkey controls recording</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {recordingMode === "push-to-talk"
                ? "Hold the hotkey to record, release to stop"
                : "Press once to start, press again to stop"}
            </p>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            value={recordingMode}
            onValueChange={(v) => {
              if (v) setRecordingMode(v as "push-to-talk" | "toggle");
            }}
          >
            <ToggleGroupItem value="push-to-talk" aria-label="Push to Talk">
              <KeyboardMusic className="h-4 w-4 mr-1.5" />
              Hold
            </ToggleGroupItem>
            <ToggleGroupItem value="toggle" aria-label="Toggle">
              <ToggleLeft className="h-4 w-4 mr-1.5" />
              Toggle
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}

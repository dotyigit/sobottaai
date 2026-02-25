"use client";

import { useState } from "react";

/**
 * Detect whether the current platform is macOS.
 * Defaults to `false` (Windows/Linux) when navigator is unavailable (SSR).
 */
export function useIsMac(): boolean {
  const [isMac] = useState(() => {
    if (typeof navigator !== "undefined") {
      return navigator.userAgent.includes("Mac");
    }
    return false;
  });
  return isMac;
}

/**
 * Parse a Tauri hotkey string (e.g. "CommandOrControl+Shift+Space")
 * into an array of display-friendly key names.
 *
 * On macOS, modifier keys include their Unicode symbols (⌘, ⌥, ⇧, ␣).
 * On Windows/Linux, plain text names are used (Ctrl, Alt, Shift, Space).
 */
export function parseHotkeyKeys(hotkey: string, isMac: boolean): string[] {
  return hotkey.split("+").map((key) => {
    switch (key) {
      case "CommandOrControl":
        return isMac ? "\u2318 Cmd" : "Ctrl";
      case "Alt":
        return isMac ? "\u2325 Option" : "Alt";
      case "Shift":
        return isMac ? "\u21E7 Shift" : "Shift";
      case "Space":
        return isMac ? "\u2423 Space" : "Space";
      default:
        // Handle e.code format: KeyA -> A, Digit1 -> 1, etc.
        if (key.startsWith("Key")) return key.slice(3);
        if (key.startsWith("Digit")) return key.slice(5);
        if (key.startsWith("Arrow")) return key.slice(5);
        if (key.startsWith("Numpad")) return "Num" + key.slice(6);
        return key;
    }
  });
}

/**
 * Format a Tauri hotkey string into a single display string.
 * e.g. "Alt+Space" -> "Option + Space" (macOS) or "Alt + Space" (Windows/Linux)
 */
export function formatHotkeyDisplay(hotkey: string, isMac: boolean): string {
  return parseHotkeyKeys(hotkey, isMac).join(" + ");
}

/**
 * Return platform-aware preset labels.
 */
export function getHotkeyPresets(isMac: boolean) {
  return [
    {
      value: "Alt+Space",
      label: isMac ? "Option + Space" : "Alt + Space",
      description: "Quick single-hand access",
    },
    {
      value: "CommandOrControl+Shift+Space",
      label: isMac ? "Cmd + Shift + Space" : "Ctrl + Shift + Space",
      description: "Standard app shortcut",
    },
    {
      value: "CommandOrControl+Shift+H",
      label: isMac ? "Cmd + Shift + H" : "Ctrl + Shift + H",
      description: 'H for "hear"',
    },
    {
      value: "CommandOrControl+Shift+R",
      label: isMac ? "Cmd + Shift + R" : "Ctrl + Shift + R",
      description: 'R for "record"',
    },
    {
      value: "F9",
      label: "F9",
      description: "Function key (no modifiers)",
    },
    {
      value: "F10",
      label: "F10",
      description: "Function key (no modifiers)",
    },
  ] as const;
}

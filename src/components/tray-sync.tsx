"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/stores/settings-store";

async function tauriListen<T>(
  event: string,
  handler: (payload: T) => void,
): Promise<(() => void) | undefined> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen<T>(event, (e) => handler(e.payload));
  } catch {
    return undefined;
  }
}

async function tauriInvoke(cmd: string, args?: Record<string, unknown>) {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke(cmd, args);
  } catch {
    // Outside Tauri context
  }
}

/**
 * Bidirectional sync between the native tray menu and the settings store.
 *
 * 1. Tray → Store: listens for tray-*-changed events and updates the Zustand store.
 * 2. Store → Tray: when settings change, calls sync_tray to update check marks.
 */
export function TraySync() {
  const {
    selectedModel,
    selectedLanguage,
    selectedAiFunction,
    setSelectedModel,
    setSelectedLanguage,
    setSelectedAiFunction,
    _hydrated,
  } = useSettingsStore();

  // Track whether a change came from the tray to prevent echo
  const fromTray = useRef(false);

  // Tray → Store: listen for tray selection events
  useEffect(() => {
    let cancelled = false;
    const cleanups: ((() => void) | undefined)[] = [];

    const setup = async () => {
      if (cancelled) return;

      cleanups.push(
        await tauriListen<string>("tray-model-changed", (model) => {
          if (cancelled) return;
          fromTray.current = true;
          setSelectedModel(model);
        }),
      );

      cleanups.push(
        await tauriListen<string>("tray-language-changed", (lang) => {
          if (cancelled) return;
          fromTray.current = true;
          setSelectedLanguage(lang);
        }),
      );

      cleanups.push(
        await tauriListen<string>("tray-ai-function-changed", (fn) => {
          if (cancelled) return;
          fromTray.current = true;
          setSelectedAiFunction(fn === "none" ? null : fn);
        }),
      );
    };

    setup();
    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn?.());
    };
  }, [setSelectedModel, setSelectedLanguage, setSelectedAiFunction]);

  // Store → Tray: sync check marks when settings change
  useEffect(() => {
    if (!_hydrated) return;

    // Skip if the change came from the tray itself (already checked)
    if (fromTray.current) {
      fromTray.current = false;
      return;
    }

    tauriInvoke("sync_tray", {
      model: selectedModel,
      language: selectedLanguage,
      aiFunction: selectedAiFunction,
    });
  }, [selectedModel, selectedLanguage, selectedAiFunction, _hydrated]);

  return null;
}

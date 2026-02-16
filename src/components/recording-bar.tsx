"use client";

import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";

export function RecordingBar() {
  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const cleanups: ((() => void) | undefined)[] = [];
    const setup = async () => {
      cleanups.push(
        await tauriListen("recording-started", () => {
          setIsRecording(true);
          setDuration(0);
        }),
      );
      cleanups.push(
        await tauriListen("recording-stopped", () => setIsRecording(false)),
      );
    };
    setup();
    return () => {
      cleanups.forEach((fn) => fn?.());
    };
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const start = Date.now();
    const interval = setInterval(() => setDuration(Date.now() - start), 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full px-5 py-2.5",
        "bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50",
        "shadow-2xl text-white text-sm select-none"
      )}
    >
      {/* Recording indicator */}
      <div
        className={cn(
          "h-3 w-3 rounded-full shrink-0",
          isRecording ? "bg-red-500 animate-pulse" : "bg-zinc-500"
        )}
      />

      {/* Duration */}
      <span className="font-mono tabular-nums min-w-[48px]">
        {minutes}:{secs.toString().padStart(2, "0")}
      </span>

      {/* Divider */}
      <div className="w-px h-4 bg-zinc-600" />

      {/* Status */}
      <span className="text-xs text-zinc-400">
        {isRecording ? "Recording" : "Processing..."}
      </span>
    </div>
  );
}

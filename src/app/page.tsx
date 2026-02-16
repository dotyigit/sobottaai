"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, History, Settings, Keyboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelSelector } from "@/components/model-selector";
import { LanguageSelector } from "@/components/language-selector";
import { AiFunctionPicker } from "@/components/ai-function-picker";
import { useRecording } from "@/hooks/use-recording";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const {
    isRecording,
    isTranscribing,
    durationMs,
    lastResult,
    toggleRecording,
  } = useRecording();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let unlisten: (() => void) | undefined;

    import("@tauri-apps/api/event").then(({ listen }) => {
      listen<string>("navigate", (event) => {
        router.push(event.payload);
      }).then((fn) => {
        unlisten = fn;
      });
    }).catch(() => {});

    return () => {
      unlisten?.();
    };
  }, [mounted, router]);

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Mic className="h-6 w-6" />
          <h1 className="text-xl font-bold">SobottaAI</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/history")}>
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Record button */}
          <button
            onClick={toggleRecording}
            disabled={isTranscribing}
            className={`rounded-full p-8 transition-all duration-200 ${
              isRecording
                ? "bg-red-500/10 border-2 border-red-500 shadow-lg shadow-red-500/20"
                : isTranscribing
                  ? "border-2 border-muted-foreground/25 opacity-60 cursor-wait"
                  : "border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
            }`}
          >
            {isRecording ? (
              <MicOff className="h-12 w-12 text-red-500 animate-pulse" />
            ) : isTranscribing ? (
              <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
            ) : (
              <Mic className="h-12 w-12 text-muted-foreground" />
            )}
          </button>

          <h2 className="text-2xl font-semibold">
            {isRecording
              ? `Recording ${minutes}:${secs.toString().padStart(2, "0")}`
              : isTranscribing
                ? "Transcribing..."
                : "Ready to record"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {isRecording ? (
              "Click the button or release the hotkey to stop recording."
            ) : (
              <>
                Click the button or press{" "}
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">
                  <Keyboard className="inline h-3 w-3 mr-1" />
                  Cmd+Shift+Space
                </kbd>{" "}
                to start recording.
              </>
            )}
          </p>
        </div>

        {/* Last result */}
        {lastResult && (
          <div className="w-full max-w-2xl rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground mb-1">Last transcription</p>
            <p className="text-sm">{lastResult}</p>
          </div>
        )}

        {/* Quick settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Model</CardTitle>
            </CardHeader>
            <CardContent>
              <ModelSelector />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Language</CardTitle>
            </CardHeader>
            <CardContent>
              <LanguageSelector />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">AI Function</CardTitle>
            </CardHeader>
            <CardContent>
              <AiFunctionPicker />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

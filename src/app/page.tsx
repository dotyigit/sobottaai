"use client";

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useRouter } from "next/navigation";
import { Mic, History, Settings, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelSelector } from "@/components/model-selector";
import { LanguageSelector } from "@/components/language-selector";
import { AiFunctionPicker } from "@/components/ai-function-picker";
import { useRecordingStore } from "@/stores/recording-store";

export default function Home() {
  const router = useRouter();
  const { isRecording } = useRecordingStore();

  useEffect(() => {
    const unlisten = listen<string>("navigate", (event) => {
      router.push(event.payload);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [router]);

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
          <div className="rounded-full border-2 border-dashed border-muted-foreground/25 p-8">
            <Mic className={`h-12 w-12 ${isRecording ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
          </div>
          <h2 className="text-2xl font-semibold">
            {isRecording ? "Recording..." : "Ready to record"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Press{" "}
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">
              <Keyboard className="inline h-3 w-3 mr-1" />
              Cmd+Shift+Space
            </kbd>{" "}
            to start recording. Speak naturally and release to transcribe.
          </p>
        </div>

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

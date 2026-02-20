"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { AppShell } from "@/components/app-shell";
import { RecordButton } from "@/components/record-button";
import { QuickSettings } from "@/components/quick-settings";
import { Onboarding } from "@/components/onboarding";
import { useRecording } from "@/hooks/use-recording";
import { useSettingsStore } from "@/stores/settings-store";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { onboardingComplete, setOnboardingComplete, _hydrated } = useSettingsStore();
  const {
    isRecording,
    isTranscribing,
    durationMs,
    lastResult,
    audioLevel,
    toggleRecording,
  } = useRecording();

  useEffect(() => {
    setMounted(true);
    import("@/stores/settings-store").then(({ useSettingsStore }) => {
      useSettingsStore.getState().hydrate();
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let unlisten: (() => void) | undefined;

    import("@tauri-apps/api/event")
      .then(({ listen }) => {
        listen<string>("navigate", (event) => {
          router.push(event.payload);
        }).then((fn) => {
          unlisten = fn;
        });
      })
      .catch(() => {});

    return () => {
      unlisten?.();
    };
  }, [mounted, router]);

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (_hydrated && !onboardingComplete) {
    return <Onboarding onComplete={() => setOnboardingComplete(true)} />;
  }

  const statusKey = isRecording ? "recording" : isTranscribing ? "transcribing" : "idle";

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        {/* Hero area — centered content */}
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          {/* Status text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={statusKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <h2 className="text-xl font-semibold tracking-tight">
                {isRecording
                  ? `Recording ${minutes}:${secs.toString().padStart(2, "0")}`
                  : isTranscribing
                    ? "Transcribing..."
                    : "Ready to Record"}
              </h2>
            </motion.div>
          </AnimatePresence>

          {/* Record button */}
          <RecordButton
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            audioLevel={audioLevel}
            onClick={toggleRecording}
          />

          {/* Hotkey hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground"
          >
            {isRecording ? (
              "Release hotkey or click to stop"
            ) : (
              <>
                Press{" "}
                <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-xs font-mono text-foreground/70">
                  <Keyboard className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                  Option+Space
                </kbd>{" "}
                to start
              </>
            )}
          </motion.p>

          {/* Last result */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                className="w-full max-w-lg overflow-hidden"
              >
                <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                    Last transcription
                  </p>
                  <div className="max-h-40 overflow-y-auto pr-1">
                    <p className="text-sm leading-relaxed">{lastResult}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="shrink-0 border-t border-border/50 bg-background/60 backdrop-blur-sm"
        >
          <QuickSettings />
        </motion.div>
      </div>
    </AppShell>
  );
}

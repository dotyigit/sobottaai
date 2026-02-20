"use client";

import { useState } from "react";
import { Mic, Download, Keyboard, Sparkles, ArrowRight, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/stores/settings-store";

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: Mic,
    title: "Welcome to SobottaAI",
    description:
      "Open-source voice-to-text with local AI. Your voice data stays on your device — no cloud required.",
  },
  {
    icon: Download,
    title: "Download a Model",
    description:
      "You need a speech-to-text model to transcribe. We recommend starting with Whisper Base (148 MB).",
  },
  {
    icon: Keyboard,
    title: "Your Hotkey",
    description:
      "Press and hold Option+Space (Alt+Space on Windows/Linux) to record. Release to transcribe and paste.",
  },
  {
    icon: Sparkles,
    title: "You're All Set!",
    description:
      "Start dictating anywhere. Your transcriptions will appear in the active text field. Check Settings for more options.",
  },
];

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const setSelectedModel = useSettingsStore((s) => s.setSelectedModel);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isModelStep = step === 1;

  async function downloadBaseModel() {
    setDownloading(true);
    try {
      await tauriInvoke("download_model", { modelId: "whisper-base" });
      setSelectedModel("whisper-base");
      setDownloaded(true);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  function next() {
    if (isLast) {
      onComplete();
    } else {
      setDirection(1);
      setStep(step + 1);
    }
  }

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md p-8 text-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            className="space-y-8"
          >
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", bounce: 0.3 }}
            >
              <div className="rounded-full border-2 border-primary/20 p-6">
                <Icon className="h-12 w-12 text-primary" />
              </div>
            </motion.div>

            <div className="space-y-3">
              <h1 className="text-2xl font-bold">{current.title}</h1>
              <p className="text-muted-foreground">{current.description}</p>
            </div>

            {isModelStep && (
              <div className="space-y-3">
                {downloaded ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center justify-center gap-2 text-sm text-green-600"
                  >
                    <Check className="h-4 w-4" />
                    Whisper Base downloaded!
                  </motion.div>
                ) : (
                  <Button
                    onClick={downloadBaseModel}
                    disabled={downloading}
                    className="w-full"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading Whisper Base (148 MB)...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Whisper Base (148 MB)
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={next}
                  className="text-muted-foreground"
                >
                  Skip for now
                </Button>
              </div>
            )}

            {!isModelStep && (
              <Button onClick={next} className="w-full">
                {isLast ? "Get Started" : "Next"}
                {!isLast && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="h-2 rounded-full"
              animate={{
                width: i === step ? 24 : 8,
                backgroundColor:
                  i === step
                    ? "var(--color-primary)"
                    : "var(--color-muted)",
              }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

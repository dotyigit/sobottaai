"use client";

import { Mic, MicOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface RecordButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  audioLevel?: number;
  onClick: () => void;
}

export function RecordButton({
  isRecording,
  isTranscribing,
  audioLevel = 0,
  onClick,
}: RecordButtonProps) {
  // Normalize level for visual scaling (typical speech RMS ~0.005-0.05)
  const normalizedLevel = Math.min(1, audioLevel * 35);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings — scale with audio level */}
      <AnimatePresence>
        {isRecording && (
          <>
            <motion.div
              key="ring1"
              className="absolute rounded-full border-2 border-recording/30"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{
                scale: 1.2 + normalizedLevel * 0.8,
                opacity: 0.15 + normalizedLevel * 0.45,
              }}
              exit={{ opacity: 0, scale: 1 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              style={{ width: 160, height: 160 }}
            />
            <motion.div
              key="ring2"
              className="absolute rounded-full border border-recording/15"
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{
                scale: 1.4 + normalizedLevel * 1.0,
                opacity: 0.08 + normalizedLevel * 0.25,
              }}
              exit={{ opacity: 0, scale: 1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{ width: 160, height: 160 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Static glow ring */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          boxShadow: isRecording
            ? `0 0 ${8 + normalizedLevel * 20}px ${2 + normalizedLevel * 4}px oklch(0.75 0.18 50 / ${0.15 + normalizedLevel * 0.25})`
            : isTranscribing
              ? "0 0 0 2px oklch(0.55 0.02 270 / 0.15)"
              : "0 0 0 2px oklch(0.45 0.18 270 / 0.08)",
        }}
        transition={{ duration: 0.1 }}
        style={{ width: 140, height: 140 }}
      />

      {/* Button */}
      <motion.button
        onClick={onClick}
        disabled={isTranscribing}
        whileHover={!isTranscribing ? { scale: 1.05 } : undefined}
        whileTap={!isTranscribing ? { scale: 0.95 } : undefined}
        className={cn(
          "relative z-10 rounded-full p-8 transition-colors duration-300",
          isRecording
            ? "bg-recording text-recording-foreground shadow-lg shadow-recording/25"
            : isTranscribing
              ? "bg-muted text-muted-foreground cursor-wait"
              : "bg-primary/10 text-primary hover:bg-primary/15"
        )}
      >
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="stop"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <MicOff className="h-10 w-10" />
            </motion.div>
          ) : isTranscribing ? (
            <motion.div
              key="loading"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Loader2 className="h-10 w-10 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="mic"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Mic className="h-10 w-10" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

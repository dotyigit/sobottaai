"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { cn } from "@/lib/utils";

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

// ── Audio-reactive sound bars (recording state) ──

const BAR_COUNT = 5;
const MIN_HEIGHT = 3;
const MAX_HEIGHT = 16;

function SoundBars({ level }: { level: number }) {
  const [barHeights, setBarHeights] = useState<number[]>(
    () => Array(BAR_COUNT).fill(MIN_HEIGHT),
  );
  const rafRef = useRef<number>(0);
  const levelRef = useRef(0);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    const velocities = Array(BAR_COUNT).fill(0);
    const current = Array(BAR_COUNT).fill(MIN_HEIGHT);
    const phaseOffsets = [0, 0.7, 1.4, 2.1, 2.8];

    const tick = () => {
      const normalized = Math.min(1, levelRef.current * 35);
      const now = Date.now() / 1000;

      for (let i = 0; i < BAR_COUNT; i++) {
        const wobble = Math.sin(now * (6 + i * 1.5) + phaseOffsets[i]);
        const jitter = wobble * normalized * 0.35;
        const target =
          MIN_HEIGHT + (normalized + jitter) * (MAX_HEIGHT - MIN_HEIGHT);

        const stiffness = 0.3;
        const damping = 0.55;
        velocities[i] += (target - current[i]) * stiffness;
        velocities[i] *= damping;
        current[i] += velocities[i];
        current[i] = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, current[i]));
      }

      setBarHeights([...current]);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="flex items-end gap-[3px] h-4">
      {barHeights.map((height, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-recording"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}

// ── Transcribing bars (loading-style bouncing) ──

const TRANSCRIBE_BAR_COUNT = 5;

function TranscribingBars() {
  const [barHeights, setBarHeights] = useState<number[]>(
    () => Array(TRANSCRIBE_BAR_COUNT).fill(4),
  );
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      const now = Date.now() / 1000;
      const newHeights = Array.from({ length: TRANSCRIBE_BAR_COUNT }, (_, i) => {
        const phase = now * 4.0 - i * 0.6;
        const bounce = Math.pow(Math.max(0, Math.sin(phase)), 2);
        return 3 + bounce * 13;
      });
      setBarHeights(newHeights);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="flex items-end gap-[3px] h-4">
      {barHeights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-muted-foreground"
          style={{
            height: `${h}px`,
            opacity: 0.4 + (h / 16) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

// ── Blue ocean wave (AI processing state) ──

const WAVE_BAR_COUNT = 20;

function ProcessingWave() {
  const [heights, setHeights] = useState<number[]>(
    () => Array(WAVE_BAR_COUNT).fill(4),
  );
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      const now = Date.now() / 1000;
      const newHeights = Array.from({ length: WAVE_BAR_COUNT }, (_, i) => {
        const wave1 = Math.sin(now * 3.0 - i * 0.35) * 0.4;
        const wave2 = Math.sin(now * 2.2 - i * 0.5 + 1.0) * 0.3;
        const combined = 0.5 + wave1 + wave2;
        return 2 + combined * 14;
      });
      setHeights(newHeights);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="flex items-end gap-[2px] h-4">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full bg-primary"
          style={{
            height: `${h}px`,
            opacity: 0.5 + (h / 16) * 0.5,
          }}
        />
      ))}
    </div>
  );
}

// ── Main recording bar ──

type PipelineState = "idle" | "recording" | "transcribing" | "ai-processing" | "complete";

export function RecordingBar() {
  // Default to "recording" — the bar is only shown during active recording,
  // so the first render should already display the recording state.
  const [pipelineState, setPipelineState] = useState<PipelineState>("recording");
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const smoothedRef = useRef(0);

  useEffect(() => {
    const cleanups: ((() => void) | undefined)[] = [];
    const setup = async () => {
      // Listen for "recording-will-start" — emitted BEFORE the blocking audio
      // init in Rust, giving us ~50-200ms to reset state before the bar window
      // becomes visible.  This eliminates the "transcribing" flash.
      cleanups.push(
        await tauriListen("recording-will-start", () => {
          setPipelineState("recording");
          setDuration(0);
          setAudioLevel(0);
          smoothedRef.current = 0;
        }),
      );
      cleanups.push(
        await tauriListen("recording-started", () => {
          setPipelineState("recording");
          setDuration(0);
          setAudioLevel(0);
          smoothedRef.current = 0;
        }),
      );
      cleanups.push(
        await tauriListen("recording-stopped", () => {
          setPipelineState("transcribing");
        }),
      );
      cleanups.push(
        await tauriListen<number>("audio-level", (level) => {
          const prev = smoothedRef.current;
          const smoothed =
            level > prev ? level * 0.7 + prev * 0.3 : level * 0.2 + prev * 0.8;
          smoothedRef.current = smoothed;
          setAudioLevel(smoothed);
        }),
      );
      cleanups.push(
        await tauriListen<string>("pipeline-state", (state) => {
          setPipelineState((prev) => {
            // While recording, ignore pipeline events from a previous cycle
            if (prev === "recording") return prev;
            if (state === "transcribing") return "transcribing";
            if (state === "ai-processing") return "ai-processing";
            if (state === "complete") return "idle";
            return prev;
          });
        }),
      );
    };
    setup();
    return () => cleanups.forEach((fn) => fn?.());
  }, []);

  useEffect(() => {
    if (pipelineState !== "recording") return;
    const start = Date.now();
    const interval = setInterval(() => setDuration(Date.now() - start), 100);
    return () => clearInterval(interval);
  }, [pipelineState]);

  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const isRecording = pipelineState === "recording";
  const isTranscribing = pipelineState === "transcribing";
  const isAiProcessing = pipelineState === "ai-processing";

  const vizKey = isRecording
    ? "recording"
    : isAiProcessing
      ? "ai-processing"
      : isTranscribing
        ? "transcribing"
        : "idle";

  const statusLabel = isRecording
    ? "Recording"
    : isTranscribing
      ? "Transcribing..."
      : isAiProcessing
        ? "Processing..."
        : "Done";

  return (
    <LayoutGroup>
      <motion.div
        layout
        transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
        className={cn(
          "inline-flex items-center gap-3 rounded-full px-5 py-2.5",
          "bg-background border border-border",
          "shadow-2xl text-foreground text-sm select-none",
        )}
      >
        {/* Visualization — cross-fade between states, pill resizes smoothly */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={vizKey}
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex items-end"
          >
            {isRecording ? (
              <SoundBars level={audioLevel} />
            ) : isAiProcessing ? (
              <ProcessingWave />
            ) : isTranscribing ? (
              <TranscribingBars />
            ) : null}
          </motion.div>
        </AnimatePresence>

        {/* Duration — collapses when not recording */}
        <AnimatePresence initial={false}>
          {isRecording && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="font-mono tabular-nums overflow-hidden whitespace-nowrap"
            >
              {minutes}:{secs.toString().padStart(2, "0")}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="w-px h-4 bg-border shrink-0" />

        {/* Status label — slide transition */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={statusLabel}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="text-xs text-muted-foreground whitespace-nowrap"
          >
            {statusLabel}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}

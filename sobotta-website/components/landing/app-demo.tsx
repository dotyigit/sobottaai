"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"

function SoundBars({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-center gap-1" style={{ height: 24 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{ backgroundColor: color }}
          animate={
            active
              ? {
                  height: [6, 20, 10, 24, 8],
                  transition: {
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.08,
                  },
                }
              : { height: 6 }
          }
        />
      ))}
    </div>
  )
}

export function AppDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [demoPhase, setDemoPhase] = useState<"idle" | "recording" | "transcribing" | "done">("idle")
  const [typedText, setTypedText] = useState("")

  const sampleText = "Hey team, let's schedule a sync for Thursday to review the Q2 roadmap..."

  useEffect(() => {
    if (!isInView) return
    const timers: NodeJS.Timeout[] = []

    timers.push(setTimeout(() => setDemoPhase("recording"), 1200))
    timers.push(setTimeout(() => setDemoPhase("transcribing"), 3700))
    timers.push(setTimeout(() => setDemoPhase("done"), 5200))

    return () => timers.forEach(clearTimeout)
  }, [isInView])

  useEffect(() => {
    if (demoPhase !== "done") {
      setTypedText("")
      return
    }

    let index = 0
    const interval = setInterval(() => {
      if (index < sampleText.length) {
        setTypedText(sampleText.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
      }
    }, 28)

    return () => clearInterval(interval)
  }, [demoPhase])

  return (
    <section className="relative px-6 py-24 md:py-32" ref={ref}>
      <div className="mx-auto max-w-4xl">
        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
          className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-brand-indigo"
        >
          See it in action
        </motion.p>

        {/* App Window Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: "spring", bounce: 0.15, duration: 0.7, delay: 0.15 }}
          className="relative mx-auto max-w-2xl"
        >
          {/* macOS-style window */}
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-border/30 bg-secondary/40 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-brand-amber/60" />
                <div className="h-3 w-3 rounded-full bg-brand-success/60" />
              </div>
              <span className="ml-3 font-mono text-xs text-muted-foreground">SobottaAI</span>
            </div>

            {/* App content */}
            <div className="flex flex-col items-center gap-6 p-8 md:p-12">
              {/* Quick settings bar */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-lg bg-secondary px-3 py-1.5 font-mono text-xs text-muted-foreground">
                  Whisper Base
                </span>
                <span className="rounded-lg bg-secondary px-3 py-1.5 font-mono text-xs text-muted-foreground">
                  English
                </span>
                <span className="rounded-lg bg-secondary px-3 py-1.5 font-mono text-xs text-brand-indigo">
                  Professional Email
                </span>
              </div>

              {/* Record button */}
              <div className="relative">
                {demoPhase === "recording" && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: "2px solid oklch(0.55 0.22 27 / 0.4)" }}
                      animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: "2px solid oklch(0.55 0.22 27 / 0.3)" }}
                      animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                    />
                  </>
                )}
                <motion.button
                  className="relative flex h-20 w-20 items-center justify-center rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      demoPhase === "recording"
                        ? "oklch(0.55 0.22 27)"
                        : demoPhase === "transcribing"
                          ? "oklch(0.45 0.12 270)"
                          : "oklch(0.65 0.20 270)",
                  }}
                  animate={demoPhase === "recording" ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  aria-label="Record button demonstration"
                >
                  {demoPhase === "recording" ? (
                    <div className="h-6 w-6 rounded-sm bg-primary-foreground" />
                  ) : demoPhase === "transcribing" ? (
                    <motion.div
                      className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <svg
                      className="h-8 w-8 text-primary-foreground"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  )}
                </motion.button>
              </div>

              {/* Status label */}
              <p className="font-mono text-xs text-muted-foreground">
                {demoPhase === "idle" && "Ready to record"}
                {demoPhase === "recording" && "Recording..."}
                {demoPhase === "transcribing" && "Transcribing..."}
                {demoPhase === "done" && "Transcribed & pasted"}
              </p>
            </div>
          </div>

          {/* Floating recording bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isInView && demoPhase !== "idle"
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 20 }
            }
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="mx-auto mt-4 flex w-fit items-center gap-4 rounded-full border border-border/50 bg-card/90 px-5 py-3 shadow-lg backdrop-blur-sm"
          >
            <SoundBars
              active={demoPhase === "recording"}
              color={demoPhase === "recording" ? "oklch(0.70 0.18 50)" : "oklch(0.50 0.03 270)"}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {demoPhase === "recording" ? "Listening..." : demoPhase === "transcribing" ? "Processing..." : "Complete"}
            </span>
          </motion.div>

          {/* Typed output simulation */}
          {demoPhase === "done" && typedText && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.2 }}
              className="mx-auto mt-6 max-w-lg rounded-xl border border-border/50 bg-secondary/30 p-4 backdrop-blur-sm"
            >
              <p className="text-sm text-foreground">
                {typedText}
                <motion.span
                  className="ml-0.5 inline-block h-4 w-0.5 bg-brand-amber"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Callout annotations */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-indigo" />
            Record with hotkey
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-amber" />
            Choose STT model &amp; language
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-success" />
            AI post-processing
          </span>
        </motion.div>
      </div>
    </section>
  )
}

"use client"

import { useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { Mail, Code, ListChecks, Settings2 } from "lucide-react"

const functions = [
  {
    id: "email",
    icon: Mail,
    label: "Professional Email",
    color: "oklch(0.65 0.20 270)",
    before:
      "hey john so i was thinking we should probably push the meeting to next week because the design team hasn't finished the mockups yet and it doesn't make sense to review incomplete work what do you think",
    after:
      "Hi John,\n\nI'd like to suggest we reschedule our review meeting to next week. The design team is still finalizing the mockups, and I believe reviewing completed work will be a more productive use of everyone's time.\n\nPlease let me know if next week works for you.\n\nBest regards",
  },
  {
    id: "code",
    icon: Code,
    label: "Code Prompt",
    color: "oklch(0.70 0.18 50)",
    before:
      "i need a react hook that fetches data from an api and caches it and it should handle loading and error states and retry on failure up to three times",
    after:
      "Create a custom React hook `useFetchWithRetry(url, options)` that:\n- Fetches data from the provided API endpoint\n- Implements a cache layer using a Map or WeakMap\n- Returns `{ data, isLoading, error }` state\n- Retries failed requests up to 3 times with exponential backoff\n- Supports abort controller for cleanup",
  },
  {
    id: "summarize",
    icon: ListChecks,
    label: "Summarize",
    color: "oklch(0.65 0.17 155)",
    before:
      "so in today's meeting we discussed the q2 roadmap and basically we agreed to prioritize the mobile app launch for april and then the api v2 migration will happen in may and sarah mentioned we need more backend engineers so we're opening two new positions",
    after:
      "Q2 Roadmap Summary:\n\n- Mobile app launch: April (priority)\n- API v2 migration: May\n- Hiring: 2 new backend engineers\n- Action: Open positions (Sarah to lead)",
  },
  {
    id: "custom",
    icon: Settings2,
    label: "Custom",
    color: "oklch(0.58 0.18 290)",
    before: "Your spoken words go here...",
    after: "Your custom AI function transforms them into exactly what you need. Define any prompt, any format, any style.",
  },
]

export function AiFunctions() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const [activeFunction, setActiveFunction] = useState(functions[0])

  return (
    <section className="relative px-6 py-24 md:py-32" ref={ref}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.18 0.04 270 / 0.5), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-indigo">
            AI Functions
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Dictation in. Polished output out.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6, delay: 0.15 }}
        >
          {/* Function selector tabs */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {functions.map((fn) => (
              <button
                key={fn.id}
                onClick={() => setActiveFunction(fn)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                style={{
                  backgroundColor:
                    activeFunction.id === fn.id
                      ? fn.color.replace(")", " / 0.15)")
                      : "transparent",
                  color:
                    activeFunction.id === fn.id
                      ? fn.color
                      : "oklch(0.65 0.03 270)",
                  border:
                    activeFunction.id === fn.id
                      ? `1px solid ${fn.color.replace(")", " / 0.3)")}`
                      : fn.id === "custom"
                        ? "1px dashed oklch(0.35 0.03 270)"
                        : "1px solid transparent",
                }}
              >
                <fn.icon className="h-4 w-4" />
                {fn.label}
              </button>
            ))}
          </div>

          {/* Before / After comparison */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFunction.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              {/* Before */}
              <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-md bg-secondary px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Voice Input
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {activeFunction.before}
                </p>
              </div>

              {/* After */}
              <div
                className="rounded-2xl border p-6"
                style={{
                  borderColor: activeFunction.color.replace(")", " / 0.2)"),
                  backgroundColor: activeFunction.color.replace(")", " / 0.04)"),
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: activeFunction.color.replace(")", " / 0.15)"),
                      color: activeFunction.color,
                    }}
                  >
                    AI Output
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {activeFunction.after}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

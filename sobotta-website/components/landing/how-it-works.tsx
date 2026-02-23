"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Mic, AudioLines, Sparkles, ClipboardCheck } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Mic,
    label: "Record",
    description: "Hold your hotkey and speak naturally",
    color: "oklch(0.70 0.18 50)",
  },
  {
    number: "02",
    icon: AudioLines,
    label: "Transcribe",
    description: "AI converts speech to text on your device",
    color: "oklch(0.65 0.20 270)",
  },
  {
    number: "03",
    icon: Sparkles,
    label: "Enhance",
    description: "Optional AI polish: emails, code prompts, summaries",
    color: "oklch(0.58 0.18 290)",
  },
  {
    number: "04",
    icon: ClipboardCheck,
    label: "Paste",
    description: "Text appears in any app automatically",
    color: "oklch(0.65 0.17 155)",
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="relative px-6 py-24 md:py-32" ref={ref}>
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-indigo">
            How it works
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            From voice to text in seconds
          </h2>
        </motion.div>

        {/* Steps pipeline */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-16 hidden h-px md:block" aria-hidden="true">
            <motion.div
              className="h-full w-full"
              style={{
                background: "linear-gradient(90deg, oklch(0.70 0.18 50), oklch(0.65 0.20 270), oklch(0.58 0.18 290), oklch(0.65 0.17 155))",
                backgroundSize: "200% 100%",
              }}
              initial={{ scaleX: 0, transformOrigin: "left" }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  type: "spring",
                  bounce: 0.25,
                  duration: 0.5,
                  delay: 0.2 + i * 0.12,
                }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Icon circle */}
                <motion.div
                  className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: step.color,
                    boxShadow: `0 0 24px ${step.color}`,
                  }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                >
                  <step.icon className="h-6 w-6 text-background" />
                </motion.div>

                {/* Step number */}
                <span
                  className="mb-1 font-mono text-xs font-semibold"
                  style={{ color: step.color }}
                >
                  {step.number}
                </span>

                {/* Label */}
                <h3 className="mb-2 text-lg font-semibold text-foreground">{step.label}</h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

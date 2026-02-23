"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { HardDrive, Cloud } from "lucide-react"

interface Model {
  name: string
  size: string
  description: string
  languages: string
  type: "local" | "cloud"
  position: number // 0-100 along the spectrum
}

const models: Model[] = [
  { name: "Whisper Tiny", size: "78 MB", description: "Fastest, lightweight", languages: "99 languages", type: "local", position: 5 },
  { name: "Whisper Base", size: "148 MB", description: "Recommended start", languages: "99 languages", type: "local", position: 18 },
  { name: "Whisper Small", size: "488 MB", description: "Balanced accuracy", languages: "99 languages", type: "local", position: 35 },
  { name: "Parakeet TDT 0.6B v2", size: "680 MB", description: "NVIDIA, ultra-fast", languages: "English", type: "local", position: 48 },
  { name: "Parakeet TDT 0.6B v3", size: "680 MB", description: "NVIDIA, latest", languages: "25 European", type: "local", position: 55 },
  { name: "Whisper Medium", size: "1.5 GB", description: "High accuracy", languages: "99 languages", type: "local", position: 72 },
  { name: "Whisper Large V3 Turbo", size: "1.6 GB", description: "Best quality", languages: "99 languages", type: "local", position: 88 },
  { name: "OpenAI Whisper API", size: "Cloud", description: "Cloud, BYOK", languages: "99 languages", type: "cloud", position: 94 },
  { name: "Groq Whisper API", size: "Cloud", description: "Ultra-fast cloud", languages: "99 languages", type: "cloud", position: 100 },
]

export function ModelShowcase() {
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
            Speech-to-Text Engines
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            9 engines. Your choice.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
            From a 78MB lightweight model to cloud-powered APIs — pick the right balance of speed, accuracy, and privacy for your workflow.
          </p>
        </motion.div>

        {/* Spectrum bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-12"
        >
          <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Fastest / Smallest</span>
            <span>Most Accurate / Largest</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, oklch(0.70 0.18 50), oklch(0.65 0.20 270), oklch(0.58 0.18 290))",
              }}
              initial={{ width: "0%" }}
              animate={isInView ? { width: "100%" } : {}}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Model cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model, i) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{
                type: "spring",
                bounce: 0.2,
                duration: 0.5,
                delay: 0.3 + i * 0.06,
              }}
              className="group flex items-start gap-3 rounded-xl border border-border/50 bg-card/40 p-4 transition-colors hover:bg-card/70"
            >
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor:
                    model.type === "local"
                      ? "oklch(0.65 0.20 270 / 0.12)"
                      : "oklch(0.70 0.18 50 / 0.12)",
                }}
              >
                {model.type === "local" ? (
                  <HardDrive
                    className="h-4 w-4"
                    style={{ color: "oklch(0.65 0.20 270)" }}
                  />
                ) : (
                  <Cloud
                    className="h-4 w-4"
                    style={{ color: "oklch(0.70 0.18 50)" }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-sm font-semibold text-foreground">
                    {model.name}
                  </h4>
                  <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {model.size}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {model.description}
                </p>
                <p className="mt-1 text-[10px] font-medium text-brand-indigo">
                  {model.languages}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

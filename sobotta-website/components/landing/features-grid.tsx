"use client"

import { motion } from "framer-motion"
import { Shield, Layers, Sparkles, Globe, ClipboardPaste, Zap } from "lucide-react"
import { StaggerChildren, StaggerItem } from "./animated-section"

const features = [
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "All transcription runs locally on your device. No audio ever leaves your machine. Your voice data is yours alone.",
    color: "oklch(0.65 0.20 270)",
  },
  {
    icon: Layers,
    title: "9 STT Engines",
    description:
      "Choose from 5 local Whisper models, 2 NVIDIA Parakeet models, or 2 cloud APIs. From 78MB tiny to 1.6GB flagship.",
    color: "oklch(0.60 0.15 240)",
  },
  {
    icon: Sparkles,
    title: "AI Post-Processing",
    description:
      "Transform dictation into professional emails, code prompts, summaries. Use OpenAI, Anthropic, Groq, or fully-local Ollama.",
    color: "oklch(0.58 0.18 290)",
  },
  {
    icon: Globe,
    title: "99 Languages",
    description:
      "Auto-detect or manually select from 99 supported languages. Built-in support for European, Asian, and Middle Eastern languages.",
    color: "oklch(0.70 0.18 50)",
  },
  {
    icon: ClipboardPaste,
    title: "Paste Anywhere",
    description:
      "Transcribed text auto-pastes into any app — your IDE, browser, email client, Slack, anything with a cursor.",
    color: "oklch(0.65 0.17 155)",
  },
  {
    icon: Zap,
    title: "GPU Accelerated",
    description:
      "Metal acceleration on macOS for near-real-time Whisper inference. Apple CoreML for Parakeet models. Native speed.",
    color: "oklch(0.72 0.16 65)",
  },
]

export function FeaturesGrid() {
  return (
    <section className="relative px-6 py-24 md:py-32">
      {/* Subtle section background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 100%, oklch(0.20 0.04 270 / 0.4), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-indigo">
            Features
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything you need to dictate like a pro
          </h2>
        </motion.div>

        <StaggerChildren className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <motion.div
                className="group relative flex h-full flex-col rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm"
                whileHover={{
                  y: -4,
                  boxShadow: `0 8px 30px ${feature.color.replace(")", " / 0.1)")}`,
                }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
              >
                {/* Icon */}
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: feature.color.replace(")", " / 0.12)"),
                  }}
                >
                  <feature.icon className="h-5 w-5" style={{ color: feature.color }} />
                </div>

                {/* Title */}
                <h3 className="mb-2 text-base font-semibold text-foreground">{feature.title}</h3>

                {/* Description */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}

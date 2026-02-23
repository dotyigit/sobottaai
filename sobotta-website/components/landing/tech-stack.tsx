"use client"

import { motion } from "framer-motion"
import { StaggerChildren, StaggerItem } from "./animated-section"

const techs = [
  {
    name: "Tauri v2",
    subtitle: "Rust",
    detail: "10x smaller than Electron",
    color: "oklch(0.70 0.18 50)",
  },
  {
    name: "whisper.cpp",
    subtitle: "C++",
    detail: "OpenAI Whisper, on-device",
    color: "oklch(0.65 0.20 270)",
  },
  {
    name: "NVIDIA Parakeet",
    subtitle: "NeMo",
    detail: "State-of-the-art STT",
    color: "oklch(0.65 0.17 155)",
  },
  {
    name: "Next.js + React",
    subtitle: "TypeScript",
    detail: "Modern UI",
    color: "oklch(0.65 0.03 270)",
  },
  {
    name: "Metal / CoreML",
    subtitle: "Apple",
    detail: "GPU accelerated",
    color: "oklch(0.58 0.18 290)",
  },
  {
    name: "SQLite",
    subtitle: "Database",
    detail: "Local-first storage",
    color: "oklch(0.60 0.12 220)",
  },
]

export function TechStack() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-indigo">
            Built with
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Powered by best-in-class technology
          </h2>
        </motion.div>

        <StaggerChildren className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {techs.map((tech) => (
            <StaggerItem key={tech.name}>
              <motion.div
                className="flex flex-col items-center rounded-2xl border border-border/50 bg-card/40 p-5 text-center backdrop-blur-sm"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl font-mono text-xs font-bold"
                  style={{
                    backgroundColor: tech.color.replace(")", " / 0.12)"),
                    color: tech.color,
                  }}
                >
                  {tech.subtitle.slice(0, 2).toUpperCase()}
                </div>
                <h4 className="mb-0.5 text-xs font-semibold text-foreground">{tech.name}</h4>
                <p className="text-[10px] text-muted-foreground">{tech.detail}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}

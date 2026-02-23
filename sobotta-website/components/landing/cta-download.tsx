"use client"

import { motion } from "framer-motion"
import { Download, Monitor, Terminal, Github } from "lucide-react"
import { AnimatedSection } from "./animated-section"

export function CtaDownload() {
  return (
    <section id="download" className="relative px-6 py-24 md:py-32">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 50% 50%, oklch(0.25 0.08 270 / 0.5), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <AnimatedSection>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-indigo">
            Get Started
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Start dictating in seconds.
          </h2>
          <p className="mb-10 text-base text-muted-foreground md:text-lg">
            Download SobottaAI — free, open-source, private.
          </p>
        </AnimatedSection>

        {/* Main download button */}
        <AnimatedSection delay={0.15}>
          <motion.a
            href="https://github.com/dotyigit/sobottaai/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center gap-3 rounded-2xl bg-primary px-10 py-4.5 text-base font-semibold text-primary-foreground shadow-xl"
            style={{
              boxShadow: "0 0 40px oklch(0.55 0.18 270 / 0.3)",
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Breathing glow */}
            <motion.span
              className="pointer-events-none absolute -inset-1 rounded-2xl"
              style={{
                background: "oklch(0.55 0.18 270 / 0.15)",
                filter: "blur(12px)",
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              aria-hidden="true"
            />
            <Download className="relative h-5 w-5" />
            <span className="relative">Download for macOS</span>
          </motion.a>
        </AnimatedSection>

        {/* Secondary platform links */}
        <AnimatedSection delay={0.25}>
          <div className="mt-6 flex items-center justify-center gap-6">
            <a
              href="https://github.com/dotyigit/sobottaai/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Monitor className="h-3.5 w-3.5" />
              Windows
            </a>
            <a
              href="https://github.com/dotyigit/sobottaai/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Terminal className="h-3.5 w-3.5" />
              Linux
            </a>
            <a
              href="https://github.com/dotyigit/sobottaai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </AnimatedSection>

        {/* Version and requirements */}
        <AnimatedSection delay={0.35}>
          <div className="mt-8 flex flex-col items-center gap-2">
            <span className="inline-flex rounded-full border border-border/50 bg-secondary/40 px-3 py-1 font-mono text-xs text-muted-foreground">
              v0.1.7 — Early Access
            </span>
            <p className="text-xs text-muted-foreground/70">
              Requires macOS 15+, Windows 10+, or Ubuntu 22.04+
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

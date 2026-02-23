"use client"

import { motion } from "framer-motion"
import { Download, Github, Monitor, Apple, Terminal } from "lucide-react"
import Image from "next/image"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24">
      {/* Background gradient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, oklch(0.30 0.12 270 / 0.4), transparent)",
        }}
      />

      {/* Subtle noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
        {/* App Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.7 }}
          className="relative mb-8"
        >
          <div
            className="absolute -inset-8 rounded-full opacity-40 blur-3xl"
            style={{ background: "oklch(0.45 0.18 270)" }}
            aria-hidden="true"
          />
          <div
            className="absolute -inset-8 rounded-full blur-3xl"
            style={{
              background: "oklch(0.45 0.18 270)",
              animation: "glow-pulse 4s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
          <Image
            src="/images/sobotta-icon.png"
            alt="SobottaAI app icon - a stylized 3D larynx with amber glowing vocal folds"
            width={120}
            height={120}
            className="relative rounded-3xl shadow-2xl"
            style={{ animation: "float 6s ease-in-out infinite" }}
            priority
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6, delay: 0.15 }}
          className="mb-4 text-5xl font-bold tracking-tight text-foreground md:text-7xl"
        >
          SobottaAI
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6, delay: 0.25 }}
          className="mb-3 text-xl font-medium text-brand-amber md:text-2xl"
        >
          Your voice, your device, your text.
        </motion.p>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6, delay: 0.35 }}
          className="mb-4 max-w-xl text-balance text-base text-muted-foreground md:text-lg"
        >
          Press a hotkey. Speak. Your words appear anywhere — transcribed locally, enhanced by AI, pasted instantly.
        </motion.p>

        {/* Keyboard shortcut */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6, delay: 0.42 }}
          className="mb-8 flex items-center gap-2"
        >
          <kbd className="rounded-lg border border-border/50 bg-secondary px-3 py-1.5 font-mono text-sm text-foreground shadow-sm">
            Option
          </kbd>
          <span className="text-muted-foreground">+</span>
          <kbd className="rounded-lg border border-border/50 bg-secondary px-3 py-1.5 font-mono text-sm text-foreground shadow-sm">
            Space
          </kbd>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6, delay: 0.5 }}
          className="mb-8 flex flex-col items-center gap-3 sm:flex-row"
        >
          <a
            href="#download"
            className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.97]"
            style={{ boxShadow: "0 0 30px oklch(0.55 0.18 270 / 0.3)" }}
          >
            <Download className="h-4 w-4" />
            Download for Mac
          </a>
          <a
            href="https://github.com/dotyigit/sobottaai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-xl border border-border/50 bg-secondary/50 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-transform hover:scale-[1.03] hover:bg-secondary active:scale-[0.97]"
          >
            <Github className="h-4 w-4" />
            View on GitHub
          </a>
        </motion.div>

        {/* Platform badges */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6, delay: 0.6 }}
          className="mb-4 flex items-center gap-6"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Apple className="h-4 w-4" />
            <span>macOS</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Monitor className="h-4 w-4" />
            <span>Windows</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Terminal className="h-4 w-4" />
            <span>Linux</span>
          </div>
        </motion.div>

        {/* Open source badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/30 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Free &amp; Open Source — MIT License
        </motion.div>
      </div>
    </section>
  )
}

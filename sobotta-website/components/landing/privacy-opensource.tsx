"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Shield, Github, Lock, Eye, Wifi, Key, Code2, Users, BarChart3, Settings } from "lucide-react"

export function PrivacyOpenSource() {
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
            Trust &amp; Transparency
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Private by design. Open by default.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Privacy card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6, delay: 0.15 }}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-8 backdrop-blur-sm"
          >
            {/* Shield glow */}
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20 blur-3xl"
              style={{ background: "oklch(0.65 0.20 270)" }}
              aria-hidden="true"
            />

            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <div className="relative">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: "oklch(0.65 0.20 270 / 0.12)",
                    }}
                  >
                    <Shield className="h-6 w-6 text-brand-indigo" />
                  </div>
                  {/* Pulse ring */}
                  <motion.div
                    className="absolute -inset-1 rounded-xl border border-brand-indigo/30"
                    animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground">100% Local. Zero Compromise.</h3>
              </div>

              <ul className="space-y-4">
                {[
                  { icon: Lock, text: "Audio never leaves your device" },
                  { icon: Eye, text: "No cloud accounts required" },
                  { icon: Wifi, text: "Use Ollama for fully offline AI processing" },
                  { icon: Key, text: "Bring your own API keys for optional cloud features" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-indigo" />
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Open Source card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6, delay: 0.25 }}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-8 backdrop-blur-sm"
          >
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20 blur-3xl"
              style={{ background: "oklch(0.70 0.18 50)" }}
              aria-hidden="true"
            />

            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: "oklch(0.70 0.18 50 / 0.12)",
                  }}
                >
                  <Github className="h-6 w-6 text-brand-amber" />
                </div>
                <h3 className="text-xl font-bold text-foreground">MIT Licensed. Fully Transparent.</h3>
              </div>

              <ul className="space-y-4">
                {[
                  { icon: Code2, text: "Inspect every line of code" },
                  { icon: Users, text: "Community-driven development" },
                  { icon: BarChart3, text: "No telemetry, no tracking" },
                  { icon: Settings, text: "Self-host and customize freely" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

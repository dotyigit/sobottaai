"use client"

import { motion } from "framer-motion"
import { Apple, Monitor, Terminal } from "lucide-react"
import { StaggerChildren, StaggerItem } from "./animated-section"

const platforms = [
  {
    name: "macOS",
    icon: Apple,
    features: [
      "Metal GPU acceleration",
      "Native tray integration",
      "LaunchAgent autostart",
      ".dmg installer",
    ],
    color: "oklch(0.65 0.03 270)",
  },
  {
    name: "Windows",
    icon: Monitor,
    features: [
      "MSVC native build",
      "System tray integration",
      ".msi / .exe installer",
      "Full feature parity",
    ],
    color: "oklch(0.60 0.15 220)",
  },
  {
    name: "Linux",
    icon: Terminal,
    features: [
      "Full ALSA audio support",
      ".deb and .AppImage packages",
      "System tray integration",
      "Wayland & X11 support",
    ],
    color: "oklch(0.70 0.18 50)",
  },
]

export function PlatformSupport() {
  return (
    <section className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-indigo">
            Cross-Platform
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Native on every desktop
          </h2>
        </motion.div>

        <StaggerChildren className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {platforms.map((platform) => (
            <StaggerItem key={platform.name}>
              <motion.div
                className="flex h-full flex-col rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm"
                whileHover={{
                  y: -4,
                  boxShadow: `0 8px 30px ${platform.color.replace(")", " / 0.1)")}`,
                }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: platform.color.replace(")", " / 0.12)"),
                  }}
                >
                  <platform.icon className="h-6 w-6" style={{ color: platform.color }} />
                </div>
                <h3 className="mb-4 text-lg font-semibold text-foreground">{platform.name}</h3>
                <ul className="space-y-2.5">
                  {platform.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: platform.color }}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Settings,
  Keyboard,
  Box,
  Sparkles,
  Wand2,
  BookOpen,
  Key,
  ArrowUpCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { getAppVersion } from "@/lib/tauri-commands";

const NAV_ITEMS = [
  { href: "/settings", label: "General", icon: Settings },
  { href: "/settings/hotkeys", label: "Hotkeys", icon: Keyboard },
  { href: "/settings/models", label: "Models", icon: Box },
  { href: "/settings/rules", label: "Rules", icon: Wand2 },
  { href: "/settings/ai-functions", label: "AI Functions", icon: Sparkles },
  { href: "/settings/vocabulary", label: "Vocabulary", icon: BookOpen },
  { href: "/settings/providers", label: "API Keys", icon: Key },
  { href: "/settings/update", label: "Update", icon: ArrowUpCircle },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [appVersion, setAppVersion] = useState("v0.1.1");

  useEffect(() => {
    let mounted = true;

    getAppVersion()
      .then((version) => {
        if (mounted) {
          setAppVersion(`v${version}`);
        }
      })
      .catch(() => {
        // Running outside Tauri (web preview/tests)
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="flex h-full min-h-0">
        {/* Sidebar */}
        <aside className="w-52 border-r border-border/50 flex flex-col shrink-0">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settings
            </h2>
          </div>
          <nav className="flex-1 p-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "relative flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="settings-nav-indicator"
                      className="absolute inset-0 rounded-md bg-accent"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                  <item.icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="px-4 py-3 border-t">
            <p className="text-[10px] text-muted-foreground/50">{appVersion}</p>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </AppShell>
  );
}

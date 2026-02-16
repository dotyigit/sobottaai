"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Settings, Keyboard, Box, Sparkles, Wand2, BookOpen, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/settings", label: "General", icon: Settings },
  { href: "/settings/hotkeys", label: "Hotkeys", icon: Keyboard },
  { href: "/settings/models", label: "Models", icon: Box },
  { href: "/settings/rules", label: "Rules", icon: Wand2 },
  { href: "/settings/ai-functions", label: "AI Functions", icon: Sparkles },
  { href: "/settings/vocabulary", label: "Vocabulary", icon: BookOpen },
  { href: "/settings/providers", label: "API Keys", icon: Key },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-56 border-r flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold">Settings</h2>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

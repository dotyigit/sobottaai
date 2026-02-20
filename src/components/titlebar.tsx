"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { History, Settings, Minus, Square, X, ArrowLeft, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

async function getWindow() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

export function Titlebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.userAgent.includes("Mac"));
  }, []);

  const isSettings = pathname.startsWith("/settings");
  const isHistory = pathname === "/history";
  const showBack = isSettings || isHistory;

  const handleMinimize = async () => {
    const win = await getWindow();
    await win.minimize();
  };

  const handleMaximize = async () => {
    const win = await getWindow();
    await win.toggleMaximize();
  };

  const handleClose = async () => {
    // Calls close(), but the backend intercepts CloseRequested to hide
    // the window instead of destroying it (and hides dock icon on macOS).
    const win = await getWindow();
    await win.close();
  };

  return (
    <header
      data-tauri-drag-region
      className="flex h-12 shrink-0 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 select-none"
    >
      {/* Left side */}
      <div className="flex items-center gap-1 min-w-[100px]">
        {isMac ? (
          /* macOS traffic lights */
          <div className="flex items-center gap-2 mr-3">
            <button
              onClick={handleClose}
              className="group h-3 w-3 rounded-full bg-[#ff5f57] hover:brightness-90 transition-all flex items-center justify-center"
            >
              <X className="h-2 w-2 text-[#4a0002] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
            </button>
            <button
              onClick={handleMinimize}
              className="group h-3 w-3 rounded-full bg-[#febc2e] hover:brightness-90 transition-all flex items-center justify-center"
            >
              <Minus className="h-2 w-2 text-[#5f4500] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
            </button>
            <button
              onClick={handleMaximize}
              className="group h-3 w-3 rounded-full bg-[#28c840] hover:brightness-90 transition-all flex items-center justify-center"
            >
              <Square className="h-1.5 w-1.5 text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
            </button>
          </div>
        ) : null}
        {showBack && (
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* Center — branding */}
      <div
        data-tauri-drag-region
        className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2"
      >
        <Mic className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold tracking-wide text-muted-foreground">
          SobottaAI
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 min-w-[100px] justify-end">
        {!showBack && (
          <>
            <button
              onClick={() => router.push("/history")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <History className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => router.push("/settings")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {!isMac && (
          /* Windows/Linux controls */
          <div className="flex items-center ml-2">
            <button
              onClick={handleMinimize}
              className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Square className="h-3 w-3" />
            </button>
            <button
              onClick={handleClose}
              className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-destructive/80 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

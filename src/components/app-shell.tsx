"use client";

import { Titlebar } from "@/components/titlebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Titlebar />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

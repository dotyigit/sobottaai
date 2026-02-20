"use client";

import { useEffect } from "react";

export default function RecordingBarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Add transparent-window class to <html> — CSS rule in globals.css
    // makes html + body transparent with !important
    document.documentElement.classList.add("transparent-window");
    return () => {
      document.documentElement.classList.remove("transparent-window");
    };
  }, []);

  return <>{children}</>;
}

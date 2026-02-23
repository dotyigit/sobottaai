import { Github, FileText, Scale } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-border/30 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 md:flex-row md:justify-between">
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/sobotta-icon.png"
            alt=""
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="text-sm font-semibold text-foreground">SobottaAI</span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6" aria-label="Footer navigation">
          <a
            href="https://github.com/dotyigit/sobottaai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
          <a
            href="https://github.com/dotyigit/sobottaai#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <FileText className="h-3.5 w-3.5" />
            Documentation
          </a>
          <a
            href="https://github.com/dotyigit/sobottaai/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Scale className="h-3.5 w-3.5" />
            MIT License
          </a>
        </nav>

        {/* Tagline + copyright */}
        <div className="text-center md:text-right">
          <p className="text-xs text-muted-foreground/70">
            Made with Rust and love
          </p>
          <p className="mt-1 text-xs text-muted-foreground/50">
            2026 SobottaAI Contributors
          </p>
        </div>
      </div>
    </footer>
  )
}

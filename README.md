# SobottaAI

Open-source, cross-platform voice-to-text desktop app with AI post-processing. Press a hotkey, speak, and your transcribed text is automatically pasted into any application.

Built with **Tauri v2** (Rust) + **Next.js** + **shadcn/ui**.

## Features

- **Push-to-talk dictation** — Global hotkey triggers recording; release to transcribe and paste
- **Local AI transcription** — Whisper (whisper.cpp) and NVIDIA Parakeet models run entirely on-device
- **Cloud STT** — Optional OpenAI Whisper API and Groq Whisper API (BYOK)
- **AI post-processing** — Professional email, code prompt, summarize, casual rewrite, translate
- **Text rules** — Filler word removal, smart punctuation, grammar correction (stackable)
- **Custom vocabulary** — Add specialized terms to improve transcription accuracy
- **Recording history** — Browse, search, replay, and re-transcribe past recordings
- **Cross-platform** — macOS, Windows, Linux
- **Privacy-first** — All processing happens locally by default; cloud features are opt-in BYOK

## Supported Models

### Local STT
| Model | Size | Languages |
|---|---|---|
| Whisper Tiny | 78 MB | 99 languages |
| Whisper Base | 148 MB | 99 languages |
| Whisper Small | 488 MB | 99 languages |
| Whisper Medium | 1.5 GB | 99 languages |
| Whisper Large V3 Turbo | 1.6 GB | 99 languages |
| NVIDIA Parakeet TDT 0.6B v2 | ~1.2 GB | English |
| NVIDIA Parakeet TDT 0.6B v3 | ~1.2 GB | 25 languages |

### LLM Providers (Optional, BYOK)
- OpenAI
- Anthropic
- Groq
- Ollama (local)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/) (latest stable)
- Platform-specific dependencies:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Windows**: MSVC Build Tools
  - **Linux**: `libasound2-dev`, `libwebkit2gtk-4.1-dev`, `patchelf`

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | Tauri v2 (Rust backend + webview) |
| Frontend | Next.js (static export) + shadcn/ui + Tailwind CSS |
| State management | Zustand |
| Local STT | whisper-rs, parakeet-rs |
| Audio capture | cpal + hound |
| Keyboard simulation | enigo |
| Database | SQLite (rusqlite) |

## License

[MIT](LICENSE)

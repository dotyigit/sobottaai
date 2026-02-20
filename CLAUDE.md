# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SobottaAI is an open-source, cross-platform voice-to-text desktop app with AI post-processing. Built with **Tauri v2** (Rust backend) + **Next.js** (static export frontend) + **shadcn/ui**. The user presses a global hotkey, speaks, and transcribed text is automatically pasted into any application.

## Commands

```bash
pnpm install              # Install dependencies
pnpm tauri dev            # Run in dev mode (Rust + Next.js hot reload)
pnpm tauri build          # Build production distributable

pnpm test                 # Run frontend tests once (vitest)
pnpm test:watch           # Run tests in watch mode
pnpm lint                 # ESLint

cargo test --manifest-path src-tauri/Cargo.toml   # Run Rust tests
cargo clippy --manifest-path src-tauri/Cargo.toml # Rust linter
```

## Architecture

### Two-process model

The app runs as a Tauri v2 desktop application with two distinct layers:

1. **Rust backend** (`src-tauri/src/`): Audio capture, STT inference, LLM API calls, SQLite persistence, system integration (global hotkeys, tray, clipboard paste). Exposed to the frontend via Tauri IPC commands.
2. **TypeScript frontend** (`src/`): Next.js static export rendered in a webview. Uses Zustand for state, shadcn/ui components, and communicates with Rust exclusively through `src/lib/tauri-commands.ts`.

### Frontend → Backend communication

All IPC goes through `src/lib/tauri-commands.ts`, which wraps `@tauri-apps/api/core` invoke calls. Every Rust command exposed via `#[tauri::command]` has a corresponding typed TypeScript function here. When adding a new command, update both `src-tauri/src/lib.rs` (invoke_handler) and `tauri-commands.ts`.

### Recording pipeline (core data flow)

Defined in `src/components/recording-pipeline.tsx`:

1. Global hotkey held → `start_recording` (Rust captures audio via cpal)
2. Hotkey released → `stop_recording` → returns `{ sessionId, durationMs }`
3. `transcribe(sessionId, modelId)` → dispatches to selected STT engine
4. `apply_rules(text, ruleIds)` → filler removal, punctuation, grammar
5. `execute_ai_function(...)` → optional LLM post-processing
6. `paste_text(text)` → auto-paste via enigo keyboard simulation
7. `save_history_item(...)` → persist to SQLite

### Rust backend modules

| Module | Purpose |
|--------|---------|
| `audio/` | Audio capture (cpal), WAV processing (hound), normalization |
| `stt/` | STT engines: `whisper.rs` (local, Metal GPU on macOS), `parakeet.rs` (sherpa-onnx), `cloud_openai.rs`, `cloud_groq.rs` |
| `llm/` | LLM providers: `openai.rs`, `anthropic.rs`, `groq.rs`, `ollama.rs` |
| `commands/` | Tauri IPC command handlers — one file per domain (recording, transcription, models, history, settings, ai_functions, vocabulary, clipboard, audio_import) |
| `rules/` | Text processing rules: `filler.rs`, `punctuation.rs`, `grammar.rs` |
| `db/` | SQLite schema + CRUD. Tables: `recordings`, `vocabulary`, `ai_functions`, `settings` |
| `system/` | `hotkey.rs` (global shortcut), `tray.rs` (system tray), `paste.rs` (keyboard simulation), `autostart.rs` |
| `models/` | Model registry, download/delete management |

### Frontend structure

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Main dashboard |
| `src/app/settings/` | Settings pages (models, providers, hotkeys, rules, vocabulary, ai-functions) |
| `src/app/history/` | Recording history |
| `src/app/recording-bar/` | Floating recording indicator (separate Tauri window) |
| `src/stores/settings-store.ts` | Zustand store: theme, model, hotkey, LLM providers, rules, recording mode |
| `src/stores/recording-store.ts` | Zustand store: current recording state, transcription progress |
| `src/components/ui/` | shadcn/ui primitives |
| `src/components/` | Feature components (recording-pipeline, record-button, onboarding, etc.) |

### Key patterns

- **State management**: Zustand stores (not React context). Settings store persists to Tauri plugin-store.
- **UI components**: shadcn/ui (New York style, zinc color, lucide icons). Add new components via `npx shadcn@latest add <component>`.
- **Path alias**: `@/*` maps to `./src/*` in tsconfig.
- **Window behavior**: Main window hides to tray on close (not destroyed). macOS switches to Accessory activation policy when hidden.
- **Platform-specific Rust**: Whisper uses Metal acceleration on macOS (`#[cfg(target_os = "macos")]`), CPU elsewhere.

## Prerequisites

- Node.js 18+, pnpm, Rust (stable)
- macOS: Xcode Command Line Tools
- Windows: MSVC Build Tools
- Linux: `libasound2-dev`, `libwebkit2gtk-4.1-dev`, `patchelf`

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development (starts Vite frontend + Tauri backend with hot reload)
npx tauri dev

# Production build (outputs .exe/.msi/.dmg/.AppImage)
npx tauri build

# Frontend only
npm run dev          # Vite dev server on http://localhost:1420
npm run build        # TypeScript compile + Vite build

# Rust only
cd src-tauri
cargo check          # Fast compilation check
cargo build          # Debug build
cargo test           # Run unit tests (WAV encoding, DB CRUD, settings)
cargo clippy -- -D warnings  # Lint

# TypeScript type check
npx tsc --noEmit
```

## Architecture Overview

VoiceFlow is a desktop voice dictation app (Tauri v2 + React + Rust). The user holds a hotkey, speaks, and the audio is transcribed via Groq Whisper, refined by an LLM, and injected into the focused text field.

### Pipeline Flow

```
Hotkey press (Ctrl+Shift+Space)
  → cpal captures audio on dedicated thread
  → Overlay window appears with waveform (audio-level events at 50ms intervals)
Hotkey release
  → Stop recording → encode WAV (16kHz mono via hound)
  → Groq Whisper STT → Groq LLM refinement (language-aware prompt)
  → Clipboard injection (enigo Ctrl+V) → save to SQLite
  → Overlay closes, pipeline-complete event fires
```

### Rust Backend (`src-tauri/src/`)

**Central state** is `AppState` in `lib.rs`: `Mutex<AudioState>` + `Mutex<Database>`, managed by Tauri.

| Module | Purpose |
|---|---|
| `commands/pipeline.rs` | Orchestrates the full pipeline, emits state events |
| `commands/overlay.rs` | Creates/destroys transparent overlay window, emits audio levels |
| `commands/injector.rs` | Clipboard save → set text → Ctrl+V → restore clipboard |
| `commands/storage.rs` | DB CRUD commands exposed to frontend |
| `audio/capture.rs` | cpal on dedicated thread (not Send+Sync), Arc<AtomicU32> for RMS level |
| `audio/encoder.rs` | Resample to 16kHz + WAV encode |
| `api/groq.rs` | Shared LazyLock reqwest client, transcribe + refine with language-aware prompts |
| `hotkey/mod.rs` | Hold-to-talk: ShortcutState::Pressed/Released triggers pipeline |
| `keychain/mod.rs` | OS keychain via keyring crate |
| `storage/database.rs` | SQLite schema (transcriptions + settings tables), search, stats |

### React Frontend (`src/`)

**State management:** Two Zustand stores, no Redux.
- `pipelineStore` — UI state driven by Tauri events (pipeline-state, pipeline-complete, pipeline-error)
- `settingsStore` — Hydrated from Rust backend on startup, writes back via IPC commands

**Routing:** HashRouter (required for Tauri, not BrowserRouter).

**Window detection:** `App.tsx` checks `getCurrentWindow().label` — if `"overlay"`, renders only the Overlay component instead of the full app shell.

**Theme:** CSS custom properties in `index.css` with `data-theme="dark"` attribute on `<html>`. Light mode is default. All components use `var(--color-*)` variables.

### Frontend ↔ Backend Communication

**IPC Commands** (invoke from React, handled in Rust):
- `start_recording`, `stop_and_process` — pipeline control
- `get_transcriptions`, `delete_transcription`, `get_stats` — data
- `get_setting`, `set_setting` — preferences
- `save_api_key`, `load_api_key`, `remove_api_key` — keychain

**Events** (emitted from Rust, listened in React via `@tauri-apps/api/event`):
- `pipeline-state` — `{state: "recording"|"encoding"|"transcribing"|"refining"|"injecting"|"idle"}`
- `pipeline-complete` — `PipelineResult` with texts and latencies
- `pipeline-error` — error string
- `audio-level` — f32 RMS level for waveform visualization

## Key Patterns

- **Audio thread safety:** cpal Stream runs on a dedicated `std::thread`. Samples collected in `Arc<Mutex<Vec<f32>>>`, recording flag in `Arc<AtomicBool>`, RMS level in `Arc<AtomicU32>` (f32 bit-stored). Thread stopped via `mpsc::channel` signal + `JoinHandle::join()`.
- **Mutex borrow lifetimes:** When locking `AppState` fields, the `MutexGuard` must be dropped before the enclosing block ends. Use `let lock_result = state.audio.lock(); match lock_result { ... }` pattern.
- **Error propagation:** Custom `VoiceFlowError` enum (thiserror) with From impls. IPC boundary converts to strings via `.map_err(|e| e.to_string())`.
- **API key storage:** Always keychain (keyring crate), never SQLite. `.env` file seeds keychain on first run via `dotenvy`.
- **Overlay window:** Created dynamically via `WebviewWindowBuilder` (transparent, no decorations, always-on-top, skip-taskbar, shadow disabled). Positioned at bottom-center of primary monitor.

## Brand / UI

- **Fonts:** DM Sans (UI), Space Mono (display/numbers), JetBrains Mono (code). Loaded from Google Fonts in `index.html`.
- **Colors:** Navy dark theme (#0A1628/#0F2040) and light theme (#F8FAFC/#FFFFFF). Brand blue gradient: #1E6FFF → #06B6D4.
- **All styling via CSS variables** (`--color-bg`, `--color-surface`, `--color-brand`, etc.) that swap between light/dark via `[data-theme="dark"]`.

## Environment

- Rust MSRV: 1.80.0 (for `LazyLock`)
- `.env` file with `GROQ_API_KEY=gsk_...` (gitignored)
- Capabilities in `src-tauri/capabilities/default.json` must include window labels for new windows

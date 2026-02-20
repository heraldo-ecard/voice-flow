<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/built%20with-Tauri%20v2%20%2B%20Rust-orange.svg" alt="Built with" />
  <img src="https://img.shields.io/badge/powered%20by-Groq%20API-green.svg" alt="Powered by" />
</p>

<h1 align="center">VoiceFlow</h1>

<p align="center">
  <strong>Free, open-source voice dictation for developers.</strong><br/>
  Speak naturally. Get clean, refined text injected into any app — instantly.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> &nbsp;·&nbsp;
  <a href="#-how-it-works">How It Works</a> &nbsp;·&nbsp;
  <a href="#-features">Features</a> &nbsp;·&nbsp;
  <a href="#%EF%B8%8F-download--install">Download</a> &nbsp;·&nbsp;
  <a href="#-contributing">Contributing</a>
</p>

---

## Why VoiceFlow?

Commercial voice dictation tools like [Wispr Flow](https://wispr.com) cost **$10-20/month** with no transparency on what happens with your audio. VoiceFlow gives you the same experience — **for free**.

- **100% open source** — audit every line of code
- **Your API key, your data** — audio goes directly to Groq, nowhere else
- **Pay only for what you use** — Groq's free tier handles ~2 hours of dictation/day. After that, costs are fractions of a cent per transcription
- **Works everywhere** — Windows, macOS, Linux
- **Built for developers** — preserves English technical terms when you speak in Portuguese, Spanish, or any other language

> **Cost comparison:** Wispr Flow = ~$15/month. VoiceFlow with Groq = **~$0.00** to **~$2/month** for heavy usage.

---

## Quick Start

**3 steps. Under 5 minutes.**

### 1. Get a Groq API key (free)

Go to [console.groq.com](https://console.groq.com/keys) → create an account → generate an API key.

Groq offers a generous free tier. You won't pay anything for normal usage.

### 2. Download VoiceFlow

| Platform | Download |
|----------|----------|
| **Windows** | [VoiceFlow-0.1.0-setup.exe](https://github.com/prsai/voice-flow/releases/latest) |
| **macOS** | [VoiceFlow-0.1.0.dmg](https://github.com/prsai/voice-flow/releases/latest) |
| **Linux** | [VoiceFlow-0.1.0.AppImage](https://github.com/prsai/voice-flow/releases/latest) |

> Or build from source — see [Build from Source](#-build-from-source) below.

### 3. Configure and go

1. Open VoiceFlow
2. Paste your Groq API key on the welcome screen
3. **Hold `Ctrl+Shift+Space`** and start talking
4. **Release** — your text appears in whatever app is focused

That's it. No account, no subscription, no data collection.

---

## How It Works

```
     Hold hotkey          Release hotkey
         │                      │
         ▼                      ▼
  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌──────────────┐
  │  Record     │───▶│  Transcribe      │───▶│  Refine         │───▶│  Paste into  │
  │  microphone │    │  (Groq Whisper)  │    │  (Groq LLM)     │    │  active app  │
  └─────────────┘    └──────────────────┘    └─────────────────┘    └──────────────┘
       ~2s                 ~0.5s                   ~0.3s                instant
```

1. **Record** — captures audio from your microphone while you hold the hotkey
2. **Transcribe** — sends audio to Groq Whisper (fast, accurate speech-to-text)
3. **Refine** — an LLM cleans up grammar, removes filler words ("uh", "like", "tipo"), and preserves technical terms
4. **Inject** — pastes the final text into whatever text field is focused (VS Code, Slack, browser, terminal — anything)

**Total latency: under 2 seconds** for most transcriptions.

---

## Features

### Core
- **Hold-to-talk hotkey** (`Ctrl+Shift+Space`) — works globally, from any app
- **Floating overlay** — small pill at the bottom of the screen shows recording waveform + processing status
- **Smart text injection** — pastes directly into the focused text field via clipboard
- **System tray** — runs quietly in the background

### Intelligence
- **9 languages** — Portuguese, English, Spanish, French, German, Italian, Japanese, Korean, Chinese
- **Developer-aware** — when speaking Portuguese (or other languages), English technical terms like "deploy", "commit", "API", "frontend" are preserved as-is
- **Grammar + punctuation** — automatically fixes speech artifacts

### Dashboard
- **Transcription history** — searchable, with raw vs refined text comparison
- **Metrics** — words today/week/month, average latency
- **Cost tracking** — estimated cost based on Groq pricing

### Customizable
- **Multiple STT models** — Whisper Large v3, Turbo, Distil
- **Multiple LLM models** — Llama 3.3 70B, Llama 3.1 8B, Gemma 2 9B, Mixtral 8x7B
- **Light / Dark mode**
- **Start with OS** option
- **API key stored in OS keychain** — never saved in plaintext

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Desktop framework | **Tauri v2** | ~5MB binary, native performance, no Electron bloat |
| Backend | **Rust** | Memory-safe, fast audio processing, no GC pauses |
| Frontend | **React + TypeScript** | Productive UI development |
| Styling | **Tailwind CSS v4** | Utility-first, tiny CSS output |
| Audio capture | **cpal** | Cross-platform microphone access |
| STT | **Groq Whisper API** | Fastest Whisper inference available |
| LLM | **Groq Chat API** | Sub-second text refinement |
| Storage | **SQLite** (bundled) | Zero-config local database |
| Keychain | **keyring** | Secure OS-level credential storage |

---

## Build from Source

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.80
- [Groq API key](https://console.groq.com/keys)

**Linux only:**
```bash
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libasound2-dev
```

### Steps

```bash
# Clone the repo
git clone https://github.com/prsai/voice-flow.git
cd voice-flow

# Install dependencies
npm install

# Set your API key
cp .env.example .env
# Edit .env → GROQ_API_KEY=gsk_your_key_here

# Run in development mode
npx tauri dev

# Or build for production
npx tauri build
# → Installer at src-tauri/target/release/bundle/
```

---

## Project Structure

```
voice-flow/
├── src/                    # React frontend
│   ├── pages/              # Dashboard, Settings, Overlay
│   ├── components/         # TranscriptionCard, Metrics, Onboarding, etc.
│   ├── stores/             # Zustand stores (pipeline state, settings)
│   └── hooks/              # Tauri event listeners
├── src-tauri/              # Rust backend
│   └── src/
│       ├── audio/          # Microphone capture + WAV encoding
│       ├── api/            # Groq API client (STT + LLM)
│       ├── commands/       # Pipeline orchestration, text injection, overlay
│       ├── hotkey/         # Global shortcut (hold-to-talk)
│       ├── keychain/       # OS keychain for API key storage
│       ├── storage/        # SQLite (transcription history + settings)
│       └── tray/           # System tray icon
└── .github/workflows/      # CI + release automation
```

---

## Groq API Pricing

VoiceFlow uses [Groq](https://groq.com) for both transcription and text refinement. Current pricing (Feb 2026):

| Service | Model | Cost |
|---------|-------|------|
| Speech-to-Text | Whisper Large v3 | ~$0.111/hour of audio |
| Text Refinement | Llama 3.3 70B | ~$0.59/1M input tokens |

**In practice:** a typical 10-second dictation costs ~$0.001 (one tenth of a cent). Most developers will stay well within Groq's free tier.

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run checks: `npx tsc --noEmit && cd src-tauri && cargo clippy -- -D warnings && cargo test`
5. Commit and open a PR

### Ideas for Contribution

- [ ] Custom hotkey configuration
- [ ] Push-to-talk toggle mode (not just hold-to-talk)
- [ ] Whisper local model support (no API key needed)
- [ ] Audio waveform visualization in dashboard
- [ ] Export transcription history (CSV/JSON)
- [ ] Multi-provider support (OpenAI, Deepgram, local Whisper)
- [ ] Custom LLM prompts per context (email, code comments, chat)

---

## FAQ

<details>
<summary><strong>Is my audio data safe?</strong></summary>

Yes. Audio is sent directly from your machine to Groq's API — VoiceFlow has no servers, no telemetry, no data collection. The code is fully open source for you to verify.
</details>

<details>
<summary><strong>Does it work offline?</strong></summary>

Not yet. VoiceFlow requires an internet connection for Groq API calls. Local Whisper support is on the roadmap.
</details>

<details>
<summary><strong>Which languages are supported?</strong></summary>

Portuguese, English, Spanish, French, German, Italian, Japanese, Korean, and Chinese. The app is especially tuned for bilingual developers who mix English technical terms with their native language.
</details>

<details>
<summary><strong>How is this different from Wispr Flow?</strong></summary>

VoiceFlow is free, open source, and runs on your own API key. Wispr Flow is a paid commercial product ($10-20/month). Both offer similar functionality — global hotkey, text refinement, paste into any app — but with VoiceFlow you own your data and pay only for actual API usage (often $0).
</details>

<details>
<summary><strong>Can I use a different API provider?</strong></summary>

Currently VoiceFlow is optimized for Groq. Multi-provider support (OpenAI, Deepgram, local models) is planned.
</details>

---

## License

[MIT](LICENSE) — use it however you want.

---

<p align="center">
  Built with Rust, React, and Groq.<br/>
  <strong>Star the repo if VoiceFlow saves you time.</strong>
</p>

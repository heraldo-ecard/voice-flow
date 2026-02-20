# VoiceFlow

Open-source desktop voice dictation app. Speak naturally, get refined text injected into any active field.

Built with **Tauri v2 + React + Rust**. Uses **Groq Whisper** for speech-to-text and **Groq LLM** for text refinement.

## Features

- **Global hotkey** (Ctrl+Shift+Space) to toggle recording from anywhere
- **Fast pipeline**: Record -> Transcribe (Whisper) -> Refine (LLM) -> Paste into active field
- **System tray** with status indicator
- **Dashboard** with transcription history, search, metrics, and cost tracking
- **Settings**: API key (stored in OS keychain), STT/LLM model selection, language, dark mode
- **Cross-platform**: Windows, macOS, Linux

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.77
- [Groq API key](https://console.groq.com/) (free tier available)
- Windows: no extra deps needed
- Linux: `sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libasound2-dev`
- macOS: Xcode Command Line Tools

### Setup

```bash
git clone https://github.com/your-user/voice-flow.git
cd voice-flow
npm install

# Set your Groq API key
cp .env.example .env
# Edit .env and add your key

# Run in dev mode
npx tauri dev
```

### Build

```bash
npx tauri build
```

Output binaries will be in `src-tauri/target/release/bundle/`.

## Architecture

```
voice-flow/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── pages/              # Dashboard, Settings
│   ├── stores/             # Zustand state management
│   └── hooks/              # Tauri event hooks
├── src-tauri/              # Rust backend
│   └── src/
│       ├── audio/          # Audio capture (cpal) + WAV encoding
│       ├── api/            # Groq API client (Whisper + LLM)
│       ├── commands/       # Pipeline, text injection, storage commands
│       ├── hotkey/         # Global shortcut registration
│       ├── keychain/       # OS keychain for API keys
│       ├── storage/        # SQLite database
│       └── tray/           # System tray
└── prototype/              # Python prototype for pipeline validation
```

## Pipeline Flow

1. **Record** - Capture audio via system microphone (cpal)
2. **Encode** - Convert to 16kHz mono WAV (with resampling if needed)
3. **Transcribe** - Send to Groq Whisper API
4. **Refine** - Clean up with Groq LLM (fix grammar, punctuation, filler words)
5. **Inject** - Paste refined text into the active text field via clipboard

## License

MIT

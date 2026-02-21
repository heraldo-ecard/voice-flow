# Changelog

All notable changes to VoiceFlow are documented here.
Format follows [Conventional Commits](https://www.conventionalcommits.org/).

## [0.3.2] — 2026-02-21

### Bug Fixes

- Replace single-arm match with if let in pipeline (clippy) ([`3216f40`](https://github.com/heraldo-ecard/voice-flow/commit/3216f4056cc70e2c6850a99aa07b49445fb191d7))
- Resolve CI failures on Linux and macOS ([`db15a0c`](https://github.com/heraldo-ecard/voice-flow/commit/db15a0ce4aabc19fc9f96d8486707b8ae3c5865b))
- Replace git-cliff Docker action with direct binary install ([`5040da7`](https://github.com/heraldo-ecard/voice-flow/commit/5040da701d694c9d8902294a58b8149f802fb9a6))

### Chores

- Bump version to v0.3.2 ([`d66e4c5`](https://github.com/heraldo-ecard/voice-flow/commit/d66e4c5f091d5f0dfc4e217b2df3b2a976f3587a))

### Documentation

- Add CHANGELOG, cliff.toml and fix README release links ([`f11b1bf`](https://github.com/heraldo-ecard/voice-flow/commit/f11b1bf4ecd792257e0dacb0a4270f87c1896b56))

## [0.3.1] — 2026-02-20

### Bug Fixes

- Correct overlay position by including monitor offset ([`6f87706`](https://github.com/heraldo-ecard/voice-flow/commit/6f8770652c64ee8910d1a0b1833d0b17b75caad0))

### Features

- Replace app icons with new VoiceFlow branding + dynamic tray states ([`1fb2bc8`](https://github.com/heraldo-ecard/voice-flow/commit/1fb2bc8764239ef63b56e6907f28f62a6e962c17))
- Add Fast Mode toggle to Dashboard header ([`bdf50c5`](https://github.com/heraldo-ecard/voice-flow/commit/bdf50c5b07aed678e05fe9215cb4d31e2f3a0382))

### Refactor

- Apply React performance best practices across frontend ([`f9263f3`](https://github.com/heraldo-ecard/voice-flow/commit/f9263f325c1bd095e6e218378ac74567c78f4eec))
- Apply React composition patterns across frontend ([`c7e8e5f`](https://github.com/heraldo-ecard/voice-flow/commit/c7e8e5f3f7514bbb7b471854f1aacfb4a995daf4))

## [0.3.0] — 2026-02-20

### Bug Fixes

- Minimize to tray on window close instead of quitting ([`76427b9`](https://github.com/heraldo-ecard/voice-flow/commit/76427b91d7a49e96dd0cee485b0771522884112b))
- Update dark mode to VSCode Dark Modern palette ([`d4a0431`](https://github.com/heraldo-ecard/voice-flow/commit/d4a0431ec7e7b5cbd3291fdd6ed2b21d09471655))
- Update Groq LLM model list to current API identifiers ([`864d089`](https://github.com/heraldo-ecard/voice-flow/commit/864d08935a77dc00b890388303596bf4fb267974))

### Chores

- Bump version to v0.3.0 ([`474e26a`](https://github.com/heraldo-ecard/voice-flow/commit/474e26a62dfea15ad8282dc0363dba2428c1fb21))

### Features

- Add raw mode to skip LLM refinement step ([`41b6ac3`](https://github.com/heraldo-ecard/voice-flow/commit/41b6ac36420aa27db09e08eb02eed91ceb800b16))

## [0.2.0] — 2026-02-20

### Bug Fixes

- Address code review issues and implement hold-to-talk hotkey ([`42eb2e3`](https://github.com/heraldo-ecard/voice-flow/commit/42eb2e3e98362adc62fe05683ed4133cdd53d12d))

### Chores

- Bump version to v0.2.0 ([`bbe2a31`](https://github.com/heraldo-ecard/voice-flow/commit/bbe2a3115e891190ce83067b10d15ae48e644fbb))

### Features

- Add Phase 0 Python prototype for pipeline validation ([`4be1a81`](https://github.com/heraldo-ecard/voice-flow/commit/4be1a818ede6efe3073dad9d685dec5810ca5d39))
- Scaffold Tauri v2 + Rust backend with full pipeline ([`cf7f2d2`](https://github.com/heraldo-ecard/voice-flow/commit/cf7f2d28e365dcb061201c8e56f03a4f17b7f008))
- Add complete React frontend with dashboard, settings, and onboarding ([`2d198fc`](https://github.com/heraldo-ecard/voice-flow/commit/2d198fc3f6ad030c318ab3b199933bf8292dd136))
- Add CI/CD workflows, README, and MIT license ([`80831eb`](https://github.com/heraldo-ecard/voice-flow/commit/80831eb4d964cfe119ad8115666039e0f7b133b6))



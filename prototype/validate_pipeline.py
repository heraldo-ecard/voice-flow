"""
VoiceFlow - Pipeline Validation Prototype
==========================================
Records audio -> Groq Whisper STT -> LLM refine -> inject into active field.

Usage:
    1. Set GROQ_API_KEY env var
    2. pip install -r requirements.txt
    3. python validate_pipeline.py

Hold SPACE to record, release to process.
"""

import io
import os
import sys
import time
import wave
import threading

import numpy as np
import pyperclip
import requests
import sounddevice as sd
from pynput import keyboard
from pynput.keyboard import Controller as KbController, Key

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_BASE = "https://api.groq.com/openai/v1"
STT_MODEL = "whisper-large-v3"
LLM_MODEL = "llama-3.3-70b-versatile"
SAMPLE_RATE = 16000
CHANNELS = 1
LANGUAGE = "pt"  # change to "en" for English

kb = KbController()

# ---------------------------------------------------------------------------
# Audio recording
# ---------------------------------------------------------------------------
class Recorder:
    def __init__(self):
        self.frames: list[np.ndarray] = []
        self.recording = False
        self.stream = None

    def start(self):
        self.frames = []
        self.recording = True
        self.stream = sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype="int16",
            callback=self._callback,
        )
        self.stream.start()
        print("[REC] Recording... (release SPACE to stop)")

    def stop(self) -> bytes:
        self.recording = False
        if self.stream:
            self.stream.stop()
            self.stream.close()
        return self._encode_wav()

    def _callback(self, indata, frames, time_info, status):
        if self.recording:
            self.frames.append(indata.copy())

    def _encode_wav(self) -> bytes:
        buf = io.BytesIO()
        audio = np.concatenate(self.frames) if self.frames else np.array([], dtype="int16")
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(audio.tobytes())
        return buf.getvalue()


# ---------------------------------------------------------------------------
# Groq API calls
# ---------------------------------------------------------------------------
def transcribe(wav_bytes: bytes) -> str:
    """Send WAV to Groq Whisper and return raw transcription."""
    url = f"{GROQ_BASE}/audio/transcriptions"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    files = {"file": ("audio.wav", wav_bytes, "audio/wav")}
    data = {"model": STT_MODEL, "language": LANGUAGE, "response_format": "text"}

    resp = requests.post(url, headers=headers, files=files, data=data, timeout=30)
    resp.raise_for_status()
    return resp.text.strip()


def refine(raw_text: str) -> str:
    """Use LLM to clean up / refine the raw transcription."""
    url = f"{GROQ_BASE}/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a dictation assistant. The user will give you raw speech-to-text output. "
                    "Fix grammar, punctuation, and remove filler words. "
                    "Keep the original meaning and language intact. "
                    "Return ONLY the corrected text, nothing else."
                ),
            },
            {"role": "user", "content": raw_text},
        ],
        "temperature": 0.3,
        "max_tokens": 2048,
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


# ---------------------------------------------------------------------------
# Text injection
# ---------------------------------------------------------------------------
def inject_text(text: str):
    """Copy text to clipboard then simulate Ctrl+V to paste into active field."""
    pyperclip.copy(text)
    time.sleep(0.05)
    kb.press(Key.ctrl)
    kb.press("v")
    kb.release("v")
    kb.release(Key.ctrl)
    print(f"[INJECT] Pasted into active field")


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
def main():
    if not GROQ_API_KEY:
        print("ERROR: Set GROQ_API_KEY environment variable.")
        sys.exit(1)

    recorder = Recorder()
    space_held = False

    print("=" * 50)
    print("VoiceFlow Prototype - Pipeline Validator")
    print("=" * 50)
    print("Hold SPACE to record, release to process.")
    print("Press ESC to quit.\n")

    def on_press(key):
        nonlocal space_held
        if key == Key.space and not space_held:
            space_held = True
            recorder.start()

    def on_release(key):
        nonlocal space_held
        if key == Key.space and space_held:
            space_held = False
            wav_data = recorder.stop()
            threading.Thread(target=process_pipeline, args=(wav_data,), daemon=True).start()
        if key == Key.esc:
            print("\n[EXIT] Bye!")
            return False

    def process_pipeline(wav_data: bytes):
        t0 = time.time()

        print("[STT] Transcribing...")
        raw = transcribe(wav_data)
        t1 = time.time()
        print(f"[STT] Raw ({t1 - t0:.2f}s): {raw}")

        if not raw:
            print("[SKIP] Empty transcription")
            return

        print("[LLM] Refining...")
        refined = refine(raw)
        t2 = time.time()
        print(f"[LLM] Refined ({t2 - t1:.2f}s): {refined}")

        inject_text(refined)

        total = t2 - t0
        print(f"[DONE] Total latency: {total:.2f}s\n")

    with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
        listener.join()


if __name__ == "__main__":
    main()

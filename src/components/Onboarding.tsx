import { useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { Mic, Key, CheckCircle } from "lucide-react";

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const { setApiKey: saveApiKey } = useSettingsStore();

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    await saveApiKey(apiKey.trim());
    setStep(2);
  };

  const steps = [
    // Welcome
    <div key="welcome" className="text-center space-y-5">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ background: "rgba(30, 111, 255, 0.12)", border: "1px solid rgba(30, 111, 255, 0.25)" }}
      >
        <Mic className="w-8 h-8" style={{ color: "var(--color-brand)" }} />
      </div>
      <h1
        className="text-3xl font-bold"
        style={{
          fontFamily: "var(--font-display)",
          background: "linear-gradient(90deg, #1E6FFF 0%, #06B6D4 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        VoiceFlow
      </h1>
      <p className="max-w-md mx-auto" style={{ color: "var(--color-text-secondary)", fontSize: "15px" }}>
        Voice dictation powered by AI. Speak naturally and have your words
        transcribed, refined, and injected into any text field.
      </p>
      <button
        onClick={() => setStep(1)}
        className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-150"
        style={{ background: "linear-gradient(135deg, #1E6FFF 0%, #0EA5E9 100%)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 20px rgba(30, 111, 255, 0.5)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "none";
        }}
      >
        Get Started
      </button>
    </div>,

    // API Key
    <div key="apikey" className="text-center space-y-5">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.25)" }}
      >
        <Key className="w-8 h-8" style={{ color: "var(--color-warning)" }} />
      </div>
      <h2 className="text-xl font-bold">Enter your Groq API Key</h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: "var(--color-text-secondary)" }}>
        VoiceFlow uses Groq for fast speech-to-text and text refinement.
        Get a free API key at{" "}
        <span style={{ color: "var(--color-brand-light)" }}>console.groq.com</span>
      </p>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="gsk_..."
        className="w-full max-w-sm mx-auto block px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
          fontFamily: "var(--font-mono)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--color-brand)";
          e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--color-brand), 0 0 12px rgba(30, 111, 255, 0.2)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(30, 111, 255, 0.15)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <button
        onClick={handleSaveKey}
        disabled={!apiKey.trim()}
        className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #1E6FFF 0%, #0EA5E9 100%)" }}
      >
        Save & Continue
      </button>
    </div>,

    // Done
    <div key="done" className="text-center space-y-5">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)" }}
      >
        <CheckCircle className="w-8 h-8" style={{ color: "var(--color-success)" }} />
      </div>
      <h2 className="text-xl font-bold">You're all set!</h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: "var(--color-text-secondary)" }}>
        Press{" "}
        <kbd
          className="px-1.5 py-0.5 rounded text-xs"
          style={{
            background: "var(--color-surface-raised)",
            fontFamily: "var(--font-mono)",
            border: "1px solid var(--color-border)",
          }}
        >
          Ctrl+Shift+Space
        </kbd>{" "}
        to start recording. Your text will be transcribed and pasted into the active field.
      </p>
      <button
        onClick={onComplete}
        className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-150"
        style={{ background: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 20px rgba(16, 185, 129, 0.5)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "none";
        }}
      >
        Start Using VoiceFlow
      </button>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-up">{steps[step]}</div>
    </div>
  );
}

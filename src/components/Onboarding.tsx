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
    <div key="welcome" className="text-center space-y-4">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
        <Mic className="w-8 h-8 text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold">Welcome to VoiceFlow</h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        Voice dictation powered by AI. Speak naturally and have your words
        transcribed, refined, and injected into any text field.
      </p>
      <button
        onClick={() => setStep(1)}
        className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
      >
        Get Started
      </button>
    </div>,

    // API Key
    <div key="apikey" className="text-center space-y-4">
      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto">
        <Key className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold">Enter your Groq API Key</h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
        VoiceFlow uses Groq for fast speech-to-text and text refinement.
        Get a free API key at console.groq.com
      </p>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="gsk_..."
        className="w-full max-w-sm mx-auto block px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <button
        onClick={handleSaveKey}
        disabled={!apiKey.trim()}
        className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save & Continue
      </button>
    </div>,

    // Done
    <div key="done" className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>
      <h2 className="text-xl font-bold">You're all set!</h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
        Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+Shift+Space</kbd> to
        start recording. Your text will be transcribed and pasted into the active field.
      </p>
      <button
        onClick={onComplete}
        className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
      >
        Start Using VoiceFlow
      </button>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">{steps[step]}</div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { Settings as SettingsIcon, Key, Mic, Brain, Globe, Keyboard, Moon, Power } from "lucide-react";

export default function Settings() {
  const {
    apiKey,
    sttModel,
    llmModel,
    language,
    hotkey,
    darkMode,
    autostart,
    loading,
    setApiKey,
    setSetting,
    toggleDarkMode,
  } = useSettingsStore();

  const [localApiKey, setLocalApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Settings are already loaded by AppContent; no need to reload here.

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const handleSaveApiKey = async () => {
    await setApiKey(localApiKey);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-8">
        <SettingsIcon className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* API Key */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold">Groq API Key</h2>
        </div>
        <div className="flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="gsk_..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {showKey ? "Hide" : "Show"}
          </button>
          <button
            onClick={handleSaveApiKey}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            Save
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Stored securely in your OS keychain. Get a key at{" "}
          <span className="text-blue-500">console.groq.com</span>
        </p>
      </section>

      {/* STT Model */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Mic className="w-4 h-4 text-red-500" />
          <h2 className="font-semibold">STT Model</h2>
        </div>
        <select
          value={sttModel}
          onChange={(e) => setSetting("stt_model", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm"
        >
          <option value="whisper-large-v3">Whisper Large v3</option>
          <option value="whisper-large-v3-turbo">Whisper Large v3 Turbo</option>
          <option value="distil-whisper-large-v3-en">Distil Whisper Large v3 (EN)</option>
        </select>
      </section>

      {/* LLM Model */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-purple-500" />
          <h2 className="font-semibold">LLM Model (Refinement)</h2>
        </div>
        <select
          value={llmModel}
          onChange={(e) => setSetting("llm_model", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm"
        >
          <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
          <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
          <option value="gemma2-9b-it">Gemma 2 9B</option>
          <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
        </select>
      </section>

      {/* Language */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-green-500" />
          <h2 className="font-semibold">Language</h2>
        </div>
        <select
          value={language}
          onChange={(e) => setSetting("language", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm"
        >
          <option value="pt">Portuguese</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
        </select>
      </section>

      {/* Hotkey */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Keyboard className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold">Hotkey</h2>
        </div>
        <input
          type="text"
          value={hotkey}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm"
        />
        <p className="text-xs text-gray-500 mt-2">
          Press the hotkey to toggle recording. Customization coming soon.
        </p>
      </section>

      {/* Toggles */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold">Dark Mode</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              darkMode ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                darkMode ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-green-500" />
            <span className="font-semibold">Start with OS</span>
          </div>
          <button
            onClick={() => setSetting("autostart", String(!autostart))}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              autostart ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                autostart ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
}

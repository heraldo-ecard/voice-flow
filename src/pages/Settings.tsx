import { useEffect, useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { Settings as SettingsIcon, Key, Mic, Brain, Globe, Keyboard, Moon, Power } from "lucide-react";

const inputStyle: React.CSSProperties = {
  background: "var(--color-input-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-sans)",
  fontSize: "14px",
  padding: "10px 14px",
  outline: "none",
  width: "100%",
  transition: "all 150ms",
};

const cardStyle: React.CSSProperties = {
  background: "var(--color-card-gradient)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "20px",
  transition: "border-color 200ms",
  boxShadow: "0 1px 3px var(--color-shadow-base)",
};

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

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--color-brand)" }} />
      </div>
    );
  }

  const handleSaveApiKey = async () => {
    await setApiKey(localApiKey);
  };

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--color-brand)";
    e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--color-brand), 0 0 12px rgba(30, 111, 255, 0.2)";
  };

  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--color-border)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-2 mb-8">
        <SettingsIcon className="w-6 h-6" style={{ color: "var(--color-text-muted)" }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-sans)" }}>Settings</h1>
      </div>

      {/* API Key */}
      <section style={cardStyle}>
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
          <h2 className="font-semibold text-sm">Groq API Key</h2>
        </div>
        <div className="flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="gsk_..."
            style={{ ...inputStyle, flex: 1 }}
            onFocus={focusHandler}
            onBlur={blurHandler}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 text-sm rounded-lg transition-all duration-150"
            style={{
              background: "transparent",
              border: "1px solid rgba(30, 111, 255, 0.25)",
              color: "var(--color-text-secondary)",
            }}
          >
            {showKey ? "Hide" : "Show"}
          </button>
          <button
            onClick={handleSaveApiKey}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-150"
            style={{ background: "linear-gradient(135deg, #1E6FFF 0%, #0EA5E9 100%)" }}
          >
            Save
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
          Stored securely in your OS keychain. Get a key at{" "}
          <span style={{ color: "var(--color-brand-light)" }}>console.groq.com</span>
        </p>
      </section>

      {/* STT Model */}
      <section style={cardStyle}>
        <div className="flex items-center gap-2 mb-3">
          <Mic className="w-4 h-4" style={{ color: "var(--color-error)" }} />
          <h2 className="font-semibold text-sm">STT Model</h2>
        </div>
        <select
          value={sttModel}
          onChange={(e) => setSetting("stt_model", e.target.value)}
          style={inputStyle}
          onFocus={focusHandler}
          onBlur={blurHandler}
        >
          <option value="whisper-large-v3">Whisper Large v3</option>
          <option value="whisper-large-v3-turbo">Whisper Large v3 Turbo</option>
          <option value="distil-whisper-large-v3-en">Distil Whisper Large v3 (EN)</option>
        </select>
      </section>

      {/* LLM Model */}
      <section style={cardStyle}>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4" style={{ color: "var(--color-brand)" }} />
          <h2 className="font-semibold text-sm">LLM Model (Refinement)</h2>
        </div>
        <select
          value={llmModel}
          onChange={(e) => setSetting("llm_model", e.target.value)}
          style={inputStyle}
          onFocus={focusHandler}
          onBlur={blurHandler}
        >
          <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
          <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
          <option value="gemma2-9b-it">Gemma 2 9B</option>
          <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
        </select>
      </section>

      {/* Language */}
      <section style={cardStyle}>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4" style={{ color: "var(--color-success)" }} />
          <h2 className="font-semibold text-sm">Language</h2>
        </div>
        <select
          value={language}
          onChange={(e) => setSetting("language", e.target.value)}
          style={inputStyle}
          onFocus={focusHandler}
          onBlur={blurHandler}
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
      <section style={cardStyle}>
        <div className="flex items-center gap-2 mb-3">
          <Keyboard className="w-4 h-4" style={{ color: "var(--color-brand-light)" }} />
          <h2 className="font-semibold text-sm">Hotkey</h2>
        </div>
        <input
          type="text"
          value={hotkey}
          readOnly
          style={{ ...inputStyle, cursor: "default" }}
        />
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
          Hold to record, release to process. Customization coming soon.
        </p>
      </section>

      {/* Toggles */}
      <section style={cardStyle} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4" style={{ color: "var(--color-brand-cyan)" }} />
            <span className="font-semibold text-sm">Dark Mode</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="relative w-11 h-6 rounded-full transition-colors duration-150"
            style={{
              background: darkMode
                ? "linear-gradient(135deg, #1E6FFF 0%, #0EA5E9 100%)"
                : "rgba(100, 116, 139, 0.3)",
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-150"
              style={{ transform: darkMode ? "translateX(20px)" : "none" }}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4" style={{ color: "var(--color-success)" }} />
            <span className="font-semibold text-sm">Start with OS</span>
          </div>
          <button
            onClick={() => setSetting("autostart", String(!autostart))}
            className="relative w-11 h-6 rounded-full transition-colors duration-150"
            style={{
              background: autostart
                ? "linear-gradient(135deg, #1E6FFF 0%, #0EA5E9 100%)"
                : "rgba(100, 116, 139, 0.3)",
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-150"
              style={{ transform: autostart ? "translateX(20px)" : "none" }}
            />
          </button>
        </div>
      </section>
    </div>
  );
}

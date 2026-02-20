import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface SettingsState {
  apiKey: string;
  sttModel: string;
  llmModel: string;
  language: string;
  hotkey: string;
  darkMode: boolean;
  autostart: boolean;
  loading: boolean;

  loadSettings: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setSetting: (key: string, value: string) => Promise<void>;
  toggleDarkMode: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiKey: "",
  sttModel: "whisper-large-v3",
  llmModel: "llama-3.3-70b-versatile",
  language: "pt",
  hotkey: "Ctrl+Shift+Space",
  darkMode: false,
  autostart: false,
  loading: true,

  loadSettings: async () => {
    try {
      const keys = [
        "stt_model",
        "llm_model",
        "language",
        "hotkey",
        "dark_mode",
        "autostart",
      ];

      const results: Record<string, string | null> = {};
      for (const key of keys) {
        results[key] = await invoke<string | null>("get_setting", { key });
      }

      // Try loading API key from keychain
      let apiKey = "";
      try {
        apiKey = await invoke<string>("load_api_key");
      } catch {
        // No key stored yet
      }

      set({
        apiKey,
        sttModel: results.stt_model || "whisper-large-v3",
        llmModel: results.llm_model || "llama-3.3-70b-versatile",
        language: results.language || "pt",
        hotkey: results.hotkey || "Ctrl+Shift+Space",
        darkMode: results.dark_mode === "true",
        autostart: results.autostart === "true",
        loading: false,
      });
    } catch (err) {
      console.error("Failed to load settings:", err);
      set({ loading: false });
    }
  },

  setApiKey: async (key: string) => {
    await invoke("save_api_key", { key });
    set({ apiKey: key });
  },

  setSetting: async (key: string, value: string) => {
    await invoke("set_setting", { key, value });

    const fieldMap: Record<string, string> = {
      stt_model: "sttModel",
      llm_model: "llmModel",
      language: "language",
      hotkey: "hotkey",
      dark_mode: "darkMode",
      autostart: "autostart",
    };

    const field = fieldMap[key];
    if (field) {
      const parsed =
        field === "darkMode" || field === "autostart"
          ? value === "true"
          : value;
      set({ [field]: parsed } as Partial<SettingsState>);
    }
  },

  toggleDarkMode: () => {
    const newValue = !get().darkMode;
    document.documentElement.classList.toggle("dark", newValue);
    get().setSetting("dark_mode", String(newValue));
  },
}));

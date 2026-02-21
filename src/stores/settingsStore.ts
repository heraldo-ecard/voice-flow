import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface SettingsState {
  apiKey: string;
  sttModel: string;
  llmModel: string;
  language: string;
  uiLanguage: string;
  hotkey: string;
  darkMode: boolean;
  autostart: boolean;
  rawMode: boolean;
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
  uiLanguage: "en",
  hotkey: "Ctrl+Shift+Space",
  darkMode: false,
  autostart: false,
  rawMode: false,
  loading: true,

  loadSettings: async () => {
    try {
      const keys = [
        "stt_model",
        "llm_model",
        "language",
        "ui_language",
        "hotkey",
        "dark_mode",
        "autostart",
        "raw_mode",
      ];

      const values = await Promise.all(
        keys.map((key) => invoke<string | null>("get_setting", { key })),
      );
      const results: Record<string, string | null> = Object.fromEntries(
        keys.map((key, i) => [key, values[i]]),
      );

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
        uiLanguage: results.ui_language || "en",
        hotkey: results.hotkey || "Ctrl+Shift+Space",
        darkMode: results.dark_mode === "true",
        autostart: results.autostart === "true",
        rawMode: results.raw_mode === "true",
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

    type BooleanField = "darkMode" | "autostart" | "rawMode";
    type SettingField = BooleanField | "sttModel" | "llmModel" | "language" | "uiLanguage" | "hotkey";

    const BACKEND_TO_STATE: Record<string, SettingField> = {
      stt_model: "sttModel",
      llm_model: "llmModel",
      language: "language",
      ui_language: "uiLanguage",
      hotkey: "hotkey",
      dark_mode: "darkMode",
      autostart: "autostart",
      raw_mode: "rawMode",
    };
    const BOOLEAN_FIELDS = new Set<BooleanField>(["darkMode", "autostart", "rawMode"]);

    const field = BACKEND_TO_STATE[key];
    if (field) {
      const parsed = BOOLEAN_FIELDS.has(field as BooleanField) ? value === "true" : value;
      set({ [field]: parsed } as Partial<SettingsState>);
    }
  },

  toggleDarkMode: () => {
    const newValue = !get().darkMode;
    document.documentElement.classList.toggle("dark", newValue);
    get().setSetting("dark_mode", String(newValue));
  },
}));

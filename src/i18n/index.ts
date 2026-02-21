import en from "./en.json";
import pt from "./pt.json";
import es from "./es.json";
import { useSettingsStore } from "../stores/settingsStore";

type Translations = typeof en;

const translations: Record<string, Translations> = { en, pt, es };

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? `{{${key}}}`));
}

export function useTranslation() {
  const uiLanguage = useSettingsStore((s) => s.uiLanguage);
  const lang = translations[uiLanguage] ?? translations.en;
  const fallback = translations.en;

  function t(key: string, params?: Record<string, string | number>): string {
    const value =
      getNestedValue(lang as Record<string, unknown>, key) ??
      getNestedValue(fallback as Record<string, unknown>, key) ??
      key;
    return interpolate(value, params);
  }

  return { t };
}

/** For use outside React components (e.g. Overlay window). */
export function getTranslation(uiLanguage: string) {
  const lang = translations[uiLanguage] ?? translations.en;
  const fallback = translations.en;

  function t(key: string, params?: Record<string, string | number>): string {
    const value =
      getNestedValue(lang as Record<string, unknown>, key) ??
      getNestedValue(fallback as Record<string, unknown>, key) ??
      key;
    return interpolate(value, params);
  }

  return { t };
}

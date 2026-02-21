import { useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { Mic, Key, CheckCircle } from "lucide-react";
import { useTranslation } from "../i18n";

interface Props {
  onComplete: () => void;
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="text-center space-y-5">
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
        {t("onboarding.tagline")}
      </p>
      <button
        onClick={onNext}
        className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-150 hover-lift"
        style={{ background: "linear-gradient(135deg, #1E6FFF 0%, #0EA5E9 100%)" }}
      >
        {t("onboarding.getStarted")}
      </button>
    </div>
  );
}

function StepApiKey({ onNext }: { onNext: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const { setApiKey: saveApiKey } = useSettingsStore();
  const { t } = useTranslation();

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    await saveApiKey(apiKey.trim());
    onNext();
  };

  return (
    <div className="text-center space-y-5">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.25)" }}
      >
        <Key className="w-8 h-8" style={{ color: "var(--color-warning)" }} />
      </div>
      <h2 className="text-xl font-bold">{t("onboarding.apiKeyTitle")}</h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: "var(--color-text-secondary)" }}>
        {t("onboarding.apiKeyDesc")}{" "}
        <span style={{ color: "var(--color-brand-light)" }}>console.groq.com</span>
      </p>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="gsk_..."
        className="w-full max-w-sm mx-auto block px-4 py-2.5 rounded-lg text-sm transition-all duration-150 input-branded"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
          fontFamily: "var(--font-mono)",
          outline: "none",
        }}
      />
      <button
        onClick={handleSave}
        disabled={!apiKey.trim()}
        className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #1E6FFF 0%, #0EA5E9 100%)" }}
      >
        {t("onboarding.saveAndContinue")}
      </button>
    </div>
  );
}

function StepDone({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const hotkey = useSettingsStore((s) => s.hotkey);
  const [descBefore, descAfter] = t("onboarding.doneDesc").split("{{hotkey}}");
  return (
    <div className="text-center space-y-5">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)" }}
      >
        <CheckCircle className="w-8 h-8" style={{ color: "var(--color-success)" }} />
      </div>
      <h2 className="text-xl font-bold">{t("onboarding.doneTitle")}</h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: "var(--color-text-secondary)" }}>
        {descBefore}
        <kbd
          className="px-1.5 py-0.5 rounded text-xs"
          style={{
            background: "var(--color-surface-raised)",
            fontFamily: "var(--font-mono)",
            border: "1px solid var(--color-border)",
          }}
        >
          {hotkey}
        </kbd>
        {descAfter}
      </p>
      <button
        onClick={onComplete}
        className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-150 hover-lift-green"
        style={{ background: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)" }}
      >
        {t("onboarding.startUsing")}
      </button>
    </div>
  );
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-up">
        {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
        {step === 1 && <StepApiKey onNext={() => setStep(2)} />}
        {step === 2 && <StepDone onComplete={onComplete} />}
      </div>
    </div>
  );
}

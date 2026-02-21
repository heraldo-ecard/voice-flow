import { useState } from "react";
import { Copy, Trash2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import toast from "react-hot-toast";
import type { Transcription } from "../types";
import { useTranslation } from "../i18n";

interface Props {
  transcription: Transcription;
  onDelete: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "Z").toLocaleString();
}

export default function TranscriptionCard({ transcription, onDelete }: Props) {
  const { t } = useTranslation();
  const [showRaw, setShowRaw] = useState(false);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(transcription.refined_text);
      toast.success(t("card.copied"));
    } catch {
      toast.error(t("card.copyFailed"));
    }
  };

  return (
    <div
      className="rounded-xl p-4 transition-all duration-150 animate-fade-up hover-card"
      style={{
        background: "var(--color-surface-raised)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm flex-1 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {transcription.refined_text}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={copyText}
            className="p-1.5 rounded transition-colors duration-150 hover-brand-light"
            style={{ color: "var(--color-text-muted)" }}
            title={t("card.copy")}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded transition-colors duration-150 hover-error"
            style={{ color: "var(--color-text-muted)" }}
            title={t("card.delete")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <span>{formatDate(transcription.created_at)}</span>
        <span>{t("card.words", { count: transcription.word_count })}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span
            className="px-1.5 py-0.5 rounded text-xs"
            style={{
              background: "rgba(30, 111, 255, 0.12)",
              color: "var(--color-brand-light)",
              border: "1px solid rgba(14, 165, 233, 0.25)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
            }}
          >
            {transcription.stt_latency_ms + transcription.llm_latency_ms}ms
          </span>
        </span>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-0.5 ml-auto transition-colors duration-150 hover-text-secondary"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t("card.raw")}
          {showRaw ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {showRaw && (
        <div
          className="mt-2 p-3 rounded-lg text-xs"
          style={{
            background: "var(--color-raw-bg)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono)",
            lineHeight: 1.7,
          }}
        >
          {transcription.raw_text}
        </div>
      )}
    </div>
  );
}

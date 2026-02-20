import { useState } from "react";
import { Copy, Trash2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import toast from "react-hot-toast";
import type { Transcription } from "../types";

interface Props {
  transcription: Transcription;
  onDelete: () => void;
}

export default function TranscriptionCard({ transcription, onDelete }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(transcription.refined_text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const totalLatency = transcription.stt_latency_ms + transcription.llm_latency_ms;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "Z");
    return date.toLocaleString();
  };

  return (
    <div
      className="rounded-xl p-4 transition-all duration-150 animate-fade-up"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(30, 111, 255, 0.10)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(30, 111, 255, 0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(30, 111, 255, 0.10)";
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm flex-1 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {transcription.refined_text}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={copyText}
            className="p-1.5 rounded transition-colors duration-150"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-brand-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
            title="Copy"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded transition-colors duration-150"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-error)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <span>{formatDate(transcription.created_at)}</span>
        <span>{transcription.word_count} words</span>
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
            {totalLatency}ms
          </span>
        </span>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-0.5 ml-auto transition-colors duration-150"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
        >
          Raw
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
            background: "#020C1A",
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

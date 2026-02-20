import { Mic, Loader2 } from "lucide-react";
import type { PipelineState } from "../stores/pipelineStore";

interface Props {
  state: PipelineState;
}

const BAR_HEIGHTS = Array.from({ length: 5 }, (_, i) => 8 + ((i * 7 + 3) % 16));

const stateLabels: Record<PipelineState, string> = {
  idle: "",
  recording: "Recording...",
  encoding: "Encoding audio...",
  transcribing: "Transcribing...",
  refining: "Refining text...",
  injecting: "Injecting text...",
};

export default function RecordingIndicator({ state }: Props) {
  if (state === "idle") return null;

  const isRecording = state === "recording";

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg transition-all duration-150"
      style={{
        background: isRecording ? "rgba(239, 68, 68, 0.08)" : "rgba(30, 111, 255, 0.08)",
        border: `1px solid ${isRecording ? "rgba(239, 68, 68, 0.25)" : "rgba(30, 111, 255, 0.25)"}`,
      }}
    >
      {isRecording ? (
        <div className="relative">
          <Mic className="w-5 h-5" style={{ color: "var(--color-error)" }} />
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping"
            style={{ background: "var(--color-error)" }}
          />
        </div>
      ) : (
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--color-brand)" }} />
      )}
      <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
        {stateLabels[state]}
      </span>

      {isRecording && (
        <div className="flex items-center gap-0.5 ml-auto">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full animate-record-pulse"
              style={{
                height: `${h}px`,
                background: "var(--color-error)",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

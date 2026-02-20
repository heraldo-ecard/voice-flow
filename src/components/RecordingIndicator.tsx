import { Mic, Loader2 } from "lucide-react";
import type { PipelineState } from "../stores/pipelineStore";

interface Props {
  state: PipelineState;
}

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
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        isRecording
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      }`}
    >
      {isRecording ? (
        <div className="relative">
          <Mic className="w-5 h-5 text-red-500" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </div>
      ) : (
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      )}
      <span className="text-sm font-medium">{stateLabels[state]}</span>

      {isRecording && (
        <div className="flex items-center gap-0.5 ml-auto">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-400 rounded-full animate-pulse"
              style={{
                height: `${8 + Math.random() * 16}px`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

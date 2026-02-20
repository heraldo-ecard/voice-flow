import { DollarSign } from "lucide-react";
import type { TranscriptionStats } from "../types";

interface Props {
  stats: TranscriptionStats;
}

const COST_PER_TRANSCRIPTION_ESTIMATE = 0.001;
const COST_PER_REFINEMENT_ESTIMATE = 0.0003;

export default function CostTracker({ stats }: Props) {
  const costPerItem = COST_PER_TRANSCRIPTION_ESTIMATE + COST_PER_REFINEMENT_ESTIMATE;
  const totalCost = stats.total_transcriptions * costPerItem;

  return (
    <div
      className="rounded-xl p-4 transition-all duration-150"
      style={{
        background: "linear-gradient(180deg, #0F2040 0%, #0A1628 100%)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-4 h-4" style={{ color: "var(--color-success)" }} />
        <h3 className="font-semibold text-sm">Estimated Cost</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            background: "linear-gradient(90deg, #10B981 0%, #06B6D4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ${totalCost.toFixed(3)}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(16, 185, 129, 0.12)",
            color: "var(--color-success)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
          }}
        >
          {stats.total_transcriptions} transcriptions
        </span>
      </div>
      <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
        Based on Groq pricing estimates. Actual costs may vary.
      </p>
    </div>
  );
}

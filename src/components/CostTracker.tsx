import { DollarSign } from "lucide-react";

interface Stats {
  total_transcriptions: number;
  total_words: number;
  words_today: number;
  words_this_week: number;
  words_this_month: number;
  avg_stt_latency_ms: number;
  avg_llm_latency_ms: number;
}

interface Props {
  stats: Stats;
}

// Rough cost estimates based on Groq pricing
// Whisper: ~$0.111 per hour of audio (~$0.000031 per second)
// LLM: ~$0.59 per 1M tokens for Llama 3.3 70B
const COST_PER_TRANSCRIPTION_ESTIMATE = 0.001; // ~$0.001 per avg transcription
const COST_PER_REFINEMENT_ESTIMATE = 0.0003; // ~$0.0003 per avg refinement

export default function CostTracker({ stats }: Props) {
  const costPerItem = COST_PER_TRANSCRIPTION_ESTIMATE + COST_PER_REFINEMENT_ESTIMATE;
  const totalCost = stats.total_transcriptions * costPerItem;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-4 h-4 text-green-500" />
        <h3 className="font-semibold text-sm">Estimated Cost</h3>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">${totalCost.toFixed(3)}</span>
        <span className="text-xs text-gray-500">
          total ({stats.total_transcriptions} transcriptions)
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Based on Groq pricing estimates. Actual costs may vary.
      </p>
    </div>
  );
}

import { MessageSquare, Clock, TrendingUp, Calendar } from "lucide-react";
import type { TranscriptionStats } from "../types";

interface Props {
  stats: TranscriptionStats;
}

export default function MetricsWidget({ stats }: Props) {
  const metrics = [
    {
      label: "Words Today",
      value: stats.words_today.toLocaleString(),
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "This Week",
      value: stats.words_this_week.toLocaleString(),
      icon: Calendar,
      color: "text-blue-500",
    },
    {
      label: "This Month",
      value: stats.words_this_month.toLocaleString(),
      icon: MessageSquare,
      color: "text-purple-500",
    },
    {
      label: "Avg Latency",
      value: `${Math.round(stats.avg_stt_latency_ms + stats.avg_llm_latency_ms)}ms`,
      icon: Clock,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-1">
            <m.icon className={`w-4 h-4 ${m.color}`} />
            <span className="text-xs text-gray-500">{m.label}</span>
          </div>
          <p className="text-xl font-bold">{m.value}</p>
        </div>
      ))}
    </div>
  );
}

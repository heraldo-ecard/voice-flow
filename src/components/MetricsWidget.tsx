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
      color: "#10B981",
    },
    {
      label: "This Week",
      value: stats.words_this_week.toLocaleString(),
      icon: Calendar,
      color: "#1E6FFF",
    },
    {
      label: "This Month",
      value: stats.words_this_month.toLocaleString(),
      icon: MessageSquare,
      color: "#06B6D4",
    },
    {
      label: "Avg Latency",
      value: `${Math.round(stats.avg_stt_latency_ms + stats.avg_llm_latency_ms)}ms`,
      icon: Clock,
      color: "#0EA5E9",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl p-4 transition-all duration-150"
          style={{
            background: "linear-gradient(180deg, #0F2040 0%, #0A1628 100%)",
            border: "1px solid var(--color-border)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(30, 111, 255, 0.35)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.5), 0 0 24px rgba(30, 111, 255, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(30, 111, 255, 0.15)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <m.icon className="w-4 h-4" style={{ color: m.color }} />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.label}</span>
          </div>
          <p
            className="text-xl font-bold"
            style={{
              background: "linear-gradient(90deg, #1E6FFF 0%, #06B6D4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "var(--font-display)",
            }}
          >
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}

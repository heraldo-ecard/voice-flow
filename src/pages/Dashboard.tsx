import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePipelineStore } from "../stores/pipelineStore";
import TranscriptionCard from "../components/TranscriptionCard";
import MetricsWidget from "../components/MetricsWidget";
import CostTracker from "../components/CostTracker";
import RecordingIndicator from "../components/RecordingIndicator";
import { Search, Mic } from "lucide-react";

interface Transcription {
  id: string;
  raw_text: string;
  refined_text: string;
  stt_latency_ms: number;
  llm_latency_ms: number;
  word_count: number;
  created_at: string;
}

interface Stats {
  total_transcriptions: number;
  total_words: number;
  words_today: number;
  words_this_week: number;
  words_this_month: number;
  avg_stt_latency_ms: number;
  avg_llm_latency_ms: number;
}

export default function Dashboard() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pipelineState = usePipelineStore((s) => s.state);
  const lastResult = usePipelineStore((s) => s.lastResult);

  const LIMIT = 20;

  const loadTranscriptions = useCallback(
    async (reset = false) => {
      try {
        const newOffset = reset ? 0 : offset;
        const items = await invoke<Transcription[]>("get_transcriptions", {
          limit: LIMIT,
          offset: newOffset,
          search: search || null,
        });
        if (reset) {
          setTranscriptions(items);
          setOffset(LIMIT);
        } else {
          setTranscriptions((prev) => [...prev, ...items]);
          setOffset(newOffset + LIMIT);
        }
        setHasMore(items.length === LIMIT);
      } catch (err) {
        console.error("Failed to load transcriptions:", err);
      }
    },
    [offset, search],
  );

  const loadStats = useCallback(async () => {
    try {
      const s = await invoke<Stats>("get_stats");
      setStats(s);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  useEffect(() => {
    loadTranscriptions(true);
    loadStats();
  }, []);

  // Reload when a new transcription arrives
  useEffect(() => {
    if (lastResult) {
      loadTranscriptions(true);
      loadStats();
    }
  }, [lastResult]);

  const handleDelete = async (id: string) => {
    try {
      await invoke("delete_transcription", { id });
      setTranscriptions((prev) => prev.filter((t) => t.id !== id));
      loadStats();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleSearch = () => {
    loadTranscriptions(true);
  };

  const handleRecord = async () => {
    try {
      if (pipelineState === "recording") {
        await invoke("stop_and_process");
      } else if (pipelineState === "idle") {
        await invoke("start_recording");
      }
    } catch (err) {
      console.error("Pipeline error:", err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={handleRecord}
          disabled={
            pipelineState !== "idle" && pipelineState !== "recording"
          }
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors ${
            pipelineState === "recording"
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : pipelineState === "idle"
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          <Mic className="w-4 h-4" />
          {pipelineState === "recording"
            ? "Stop"
            : pipelineState === "idle"
              ? "Record"
              : "Processing..."}
        </button>
      </div>

      {/* Recording indicator */}
      {pipelineState !== "idle" && <RecordingIndicator state={pipelineState} />}

      {/* Metrics */}
      {stats && <MetricsWidget stats={stats} />}

      {/* Cost tracker */}
      {stats && <CostTracker stats={stats} />}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search transcriptions..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Search
        </button>
      </div>

      {/* Transcription list */}
      <div className="space-y-3">
        {transcriptions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No transcriptions yet.</p>
            <p className="text-sm">
              Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Shift+Space</kbd> or click Record to start.
            </p>
          </div>
        ) : (
          transcriptions.map((t) => (
            <TranscriptionCard
              key={t.id}
              transcription={t}
              onDelete={() => handleDelete(t.id)}
            />
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && transcriptions.length > 0 && (
        <button
          onClick={() => loadTranscriptions(false)}
          className="w-full py-2 text-sm text-blue-500 hover:text-blue-600"
        >
          Load more...
        </button>
      )}
    </div>
  );
}

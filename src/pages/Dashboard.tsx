import { useEffect, useState, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePipelineStore } from "../stores/pipelineStore";
import TranscriptionCard from "../components/TranscriptionCard";
import MetricsWidget from "../components/MetricsWidget";
import CostTracker from "../components/CostTracker";
import RecordingIndicator from "../components/RecordingIndicator";
import { Search, Mic } from "lucide-react";
import type { Transcription, TranscriptionStats } from "../types";

export default function Dashboard() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [stats, setStats] = useState<TranscriptionStats | null>(null);
  const [search, setSearch] = useState("");
  const offsetRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const pipelineState = usePipelineStore((s) => s.state);
  const lastResult = usePipelineStore((s) => s.lastResult);

  const LIMIT = 20;

  const loadTranscriptions = useCallback(
    async (reset = false) => {
      try {
        const currentOffset = reset ? 0 : offsetRef.current;
        const items = await invoke<Transcription[]>("get_transcriptions", {
          limit: LIMIT,
          offset: currentOffset,
          search: search || null,
        });
        if (reset) {
          setTranscriptions(items);
          offsetRef.current = LIMIT;
        } else {
          setTranscriptions((prev) => [...prev, ...items]);
          offsetRef.current = currentOffset + LIMIT;
        }
        setHasMore(items.length === LIMIT);
      } catch (err) {
        console.error("Failed to load transcriptions:", err);
      }
    },
    [search],
  );

  const loadStats = useCallback(async () => {
    try {
      const s = await invoke<TranscriptionStats>("get_stats");
      setStats(s);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadTranscriptions(true), loadStats()]);
  }, [loadTranscriptions, loadStats]);

  useEffect(() => {
    if (lastResult) {
      Promise.all([loadTranscriptions(true), loadStats()]);
    }
  }, [lastResult, loadTranscriptions, loadStats]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await invoke("delete_transcription", { id });
      setTranscriptions((prev) => prev.filter((t) => t.id !== id));
      loadStats();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }, [loadStats]);

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
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-sans)", fontWeight: 700 }}>
          Dashboard
        </h1>
        <button
          onClick={handleRecord}
          disabled={pipelineState !== "idle" && pipelineState !== "recording"}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-150${pipelineState === "idle" ? " hover-lift" : ""}`}
          style={
            pipelineState === "recording"
              ? { background: "var(--color-error)" }
              : pipelineState === "idle"
                ? { background: "linear-gradient(135deg, #1E6FFF 0%, #0EA5E9 100%)" }
                : { background: "var(--color-text-muted)", cursor: "not-allowed" }
          }
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search transcriptions..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none transition-all duration-150 input-branded"
            style={{
              background: "var(--color-input-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover-ghost-brand"
          style={{
            background: "transparent",
            border: "1px solid rgba(30, 111, 255, 0.25)",
            color: "var(--color-text-secondary)",
          }}
        >
          Search
        </button>
      </div>

      {/* Transcription list */}
      <div className="space-y-3">
        {transcriptions.length === 0 ? (
          <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>
            <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No transcriptions yet.</p>
            <p className="text-sm mt-1">
              Hold{" "}
              <kbd
                className="px-1.5 py-0.5 rounded text-xs"
                style={{
                  background: "var(--color-surface-raised)",
                  fontFamily: "var(--font-mono)",
                  border: "1px solid var(--color-border)",
                }}
              >
                Ctrl+Shift+Space
              </kbd>{" "}
              to record, release to process.
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
          className="w-full py-2 text-sm font-medium transition-colors duration-150 hover-brand-light"
          style={{ color: "var(--color-brand)" }}
        >
          Load more...
        </button>
      )}
    </div>
  );
}

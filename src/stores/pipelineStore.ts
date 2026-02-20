import { create } from "zustand";

export type PipelineState =
  | "idle"
  | "recording"
  | "encoding"
  | "transcribing"
  | "refining"
  | "injecting";

interface PipelineResult {
  raw_text: string;
  refined_text: string;
  stt_latency_ms: number;
  llm_latency_ms: number;
  total_latency_ms: number;
}

interface PipelineStore {
  state: PipelineState;
  lastResult: PipelineResult | null;
  lastError: string | null;

  setState: (state: PipelineState) => void;
  setResult: (result: PipelineResult) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  state: "idle",
  lastResult: null,
  lastError: null,

  setState: (state) => set({ state }),
  setResult: (result) => set({ lastResult: result, lastError: null }),
  setError: (error) => set({ lastError: error, state: "idle" }),
  clearError: () => set({ lastError: null }),
}));

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { usePipelineStore } from "../stores/pipelineStore";
import toast from "react-hot-toast";

export function useTauriEvents() {
  const { setState, setResult, setError } = usePipelineStore();

  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    async function setup() {
      unlisteners.push(
        await listen<{ state: string }>("pipeline-state", (event) => {
          setState(event.payload.state as ReturnType<typeof usePipelineStore.getState>["state"]);
        }),
      );

      unlisteners.push(
        await listen("pipeline-complete", (event) => {
          const result = event.payload as {
            raw_text: string;
            refined_text: string;
            stt_latency_ms: number;
            llm_latency_ms: number;
            total_latency_ms: number;
          };
          setResult(result);
          toast.success(`Transcribed in ${result.total_latency_ms}ms`);
        }),
      );

      unlisteners.push(
        await listen<string>("pipeline-error", (event) => {
          setError(event.payload);
          toast.error(`Error: ${event.payload}`);
        }),
      );
    }

    setup();

    return () => {
      unlisteners.forEach((fn) => fn());
    };
  }, [setState, setResult, setError]);
}

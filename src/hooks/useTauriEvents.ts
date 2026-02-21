import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { usePipelineStore } from "../stores/pipelineStore";
import { useSettingsStore } from "../stores/settingsStore";
import { getTranslation } from "../i18n";
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
          const { t } = getTranslation(useSettingsStore.getState().uiLanguage);
          toast.success(t("toast.transcribed", { ms: result.total_latency_ms }));
        }),
      );

      unlisteners.push(
        await listen<string>("pipeline-error", (event) => {
          setError(event.payload);
          const { t } = getTranslation(useSettingsStore.getState().uiLanguage);
          toast.error(t("toast.error", { message: event.payload }));
        }),
      );
    }

    setup();

    return () => {
      unlisteners.forEach((fn) => fn());
    };
  }, [setState, setResult, setError]);
}

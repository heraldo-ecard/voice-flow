import { useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

const BAR_COUNT = 18;

export default function Overlay() {
  const [state, setState] = useState<string>("recording");
  const [levels, setLevels] = useState<number[]>(new Array(BAR_COUNT).fill(0));
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Load theme from settings
    invoke<string | null>("get_setting", { key: "dark_mode" }).then((val) => {
      setIsDark(val === "true");
    }).catch(() => {});

    const unlisteners: Array<() => void> = [];

    async function setup() {
      unlisteners.push(
        await listen<{ state: string }>("pipeline-state", (event) => {
          setState(event.payload.state);
        }),
      );

      unlisteners.push(
        await listen<number>("audio-level", (event) => {
          const level = event.payload;
          setLevels((prev) => [...prev.slice(1), level]);
        }),
      );
    }

    setup();
    return () => unlisteners.forEach((fn) => fn());
  }, []);

  const isRecording = state === "recording";
  const isProcessing = ["encoding", "transcribing", "refining", "injecting"].includes(state);

  const { pillBg, pillBorder, pillShadow, processingTextColor } = useMemo(() => ({
    pillBg: isDark ? "rgba(10, 22, 40, 0.92)" : "rgba(255, 255, 255, 0.92)",
    pillBorder: isDark ? "rgba(30, 111, 255, 0.20)" : "rgba(30, 111, 255, 0.15)",
    pillShadow: isDark ? "none" : "0 2px 12px rgba(0, 0, 0, 0.12)",
    processingTextColor: isDark ? "rgba(203, 213, 225, 0.7)" : "rgba(71, 85, 105, 0.8)",
  }), [isDark]);

  return (
    <div
      className="w-full h-full flex items-center justify-center select-none"
      style={{ background: "transparent" }}
      data-tauri-drag-region
    >
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: 138,
          height: 32,
          background: pillBg,
          backdropFilter: "blur(12px)",
          border: `1px solid ${pillBorder}`,
          boxShadow: pillShadow,
        }}
      >
        {isRecording && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-[6px] h-[6px] rounded-full flex-shrink-0 animate-record-pulse"
              style={{ background: "#EF4444" }}
            />
            <div className="flex items-center gap-[1.5px] h-4">
              {levels.map((level, i) => (
                <div
                  key={i}
                  className="w-[1.5px] rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(2, Math.min(16, level * 160))}px`,
                    background: "linear-gradient(to top, #1E6FFF, #06B6D4)",
                    opacity: 0.6 + Math.min(0.4, level * 4),
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {isProcessing && (
          <div className="flex items-center gap-1.5">
            <div className="flex gap-[3px]">
              <div
                className="w-[5px] h-[5px] rounded-full animate-bounce"
                style={{ background: "#1E6FFF", animationDelay: "0ms" }}
              />
              <div
                className="w-[5px] h-[5px] rounded-full animate-bounce"
                style={{ background: "#0EA5E9", animationDelay: "150ms" }}
              />
              <div
                className="w-[5px] h-[5px] rounded-full animate-bounce"
                style={{ background: "#06B6D4", animationDelay: "300ms" }}
              />
            </div>
            <span
              className="text-[10px] font-medium leading-none"
              style={{ color: processingTextColor, fontFamily: "'DM Sans', sans-serif" }}
            >
              Processing
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

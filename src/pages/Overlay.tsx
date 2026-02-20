import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";

const BAR_COUNT = 24;

export default function Overlay() {
  const [state, setState] = useState<string>("recording");
  const [levels, setLevels] = useState<number[]>(new Array(BAR_COUNT).fill(0));
  const levelsRef = useRef(levels);

  useEffect(() => {
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
          const next = [...levelsRef.current.slice(1), level];
          levelsRef.current = next;
          setLevels(next);
        }),
      );
    }

    setup();
    return () => unlisteners.forEach((fn) => fn());
  }, []);

  const isRecording = state === "recording";
  const isProcessing = ["encoding", "transcribing", "refining", "injecting"].includes(state);

  return (
    <div
      className="w-full h-full flex items-center justify-center select-none"
      style={{ background: "transparent" }}
      data-tauri-drag-region
    >
      <div className="bg-gray-900/90 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center gap-3 shadow-2xl border border-white/10">
        {isRecording && (
          <>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <div className="flex items-center gap-[2px] h-7">
              {levels.map((level, i) => (
                <div
                  key={i}
                  className="w-[2.5px] rounded-full bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-75"
                  style={{
                    height: `${Math.max(3, Math.min(28, level * 280))}px`,
                    opacity: 0.6 + Math.min(0.4, level * 4),
                  }}
                />
              ))}
            </div>
          </>
        )}
        {isProcessing && (
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-white/70 text-[11px] font-medium tracking-wide">
              Processing...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

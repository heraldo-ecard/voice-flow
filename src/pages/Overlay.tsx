import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";

const BAR_COUNT = 18;

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
      <div
        className="bg-gray-900/90 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10"
        style={{ width: 150, height: 32 }}
      >
        {isRecording && (
          <div className="flex items-center gap-1.5">
            <div className="w-[6px] h-[6px] rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <div className="flex items-center gap-[1.5px] h-4">
              {levels.map((level, i) => (
                <div
                  key={i}
                  className="w-[1.5px] rounded-full bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-75"
                  style={{
                    height: `${Math.max(2, Math.min(16, level * 160))}px`,
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
                className="w-[5px] h-[5px] rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-[5px] h-[5px] rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-[5px] h-[5px] rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-white/70 text-[10px] font-medium leading-none">
              Processing
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

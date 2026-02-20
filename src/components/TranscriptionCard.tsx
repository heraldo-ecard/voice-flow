import { useState } from "react";
import { Copy, Trash2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface Transcription {
  id: string;
  raw_text: string;
  refined_text: string;
  stt_latency_ms: number;
  llm_latency_ms: number;
  word_count: number;
  created_at: string;
}

interface Props {
  transcription: Transcription;
  onDelete: () => void;
}

export default function TranscriptionCard({ transcription, onDelete }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(transcription.refined_text);
    toast.success("Copied to clipboard");
  };

  const totalLatency = transcription.stt_latency_ms + transcription.llm_latency_ms;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "Z");
    return date.toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm flex-1 leading-relaxed">
          {transcription.refined_text}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={copyText}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Copy"
          >
            <Copy className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
        <span>{formatDate(transcription.created_at)}</span>
        <span>{transcription.word_count} words</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {totalLatency}ms
        </span>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-0.5 hover:text-gray-700 dark:hover:text-gray-300 ml-auto"
        >
          Raw
          {showRaw ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {showRaw && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400">
          {transcription.raw_text}
        </div>
      )}
    </div>
  );
}

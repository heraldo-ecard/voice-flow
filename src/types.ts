export interface Transcription {
  id: string;
  raw_text: string;
  refined_text: string;
  stt_latency_ms: number;
  llm_latency_ms: number;
  word_count: number;
  created_at: string;
}

export interface TranscriptionStats {
  total_transcriptions: number;
  total_words: number;
  words_today: number;
  words_this_week: number;
  words_this_month: number;
  avg_stt_latency_ms: number;
  avg_llm_latency_ms: number;
}

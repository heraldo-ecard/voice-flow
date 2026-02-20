use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transcription {
    pub id: String,
    pub raw_text: String,
    pub refined_text: String,
    pub stt_latency_ms: i64,
    pub llm_latency_ms: i64,
    pub word_count: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionStats {
    pub total_transcriptions: i64,
    pub total_words: i64,
    pub words_today: i64,
    pub words_this_week: i64,
    pub words_this_month: i64,
    pub avg_stt_latency_ms: f64,
    pub avg_llm_latency_ms: f64,
}

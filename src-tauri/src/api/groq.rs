use reqwest::multipart;
use serde::Deserialize;

use crate::errors::{Result, VoiceFlowError};

const GROQ_BASE_URL: &str = "https://api.groq.com/openai/v1";

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

#[derive(Debug, Deserialize)]
struct ChatMessage {
    content: String,
}

/// Transcribe WAV audio using Groq Whisper API.
pub async fn transcribe(
    api_key: &str,
    wav_data: Vec<u8>,
    model: &str,
    language: &str,
) -> Result<String> {
    let client = reqwest::Client::new();

    let file_part = multipart::Part::bytes(wav_data)
        .file_name("audio.wav")
        .mime_str("audio/wav")
        .map_err(|e| VoiceFlowError::Api(e.to_string()))?;

    let form = multipart::Form::new()
        .part("file", file_part)
        .text("model", model.to_string())
        .text("language", language.to_string())
        .text("response_format", "text".to_string());

    let resp = client
        .post(format!("{}/audio/transcriptions", GROQ_BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
        .multipart(form)
        .send()
        .await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(VoiceFlowError::Api(format!(
            "Groq STT error {}: {}",
            status, body
        )));
    }

    let text = resp.text().await?;
    Ok(text.trim().to_string())
}

/// Refine raw transcription using Groq LLM.
pub async fn refine(api_key: &str, raw_text: &str, model: &str) -> Result<String> {
    let client = reqwest::Client::new();

    let payload = serde_json::json!({
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a dictation assistant. The user will give you raw speech-to-text output. Fix grammar, punctuation, and remove filler words. Keep the original meaning and language intact. Return ONLY the corrected text, nothing else."
            },
            {
                "role": "user",
                "content": raw_text
            }
        ],
        "temperature": 0.3,
        "max_tokens": 2048
    });

    let resp = client
        .post(format!("{}/chat/completions", GROQ_BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(VoiceFlowError::Api(format!(
            "Groq LLM error {}: {}",
            status, body
        )));
    }

    let chat_resp: ChatResponse = resp.json().await?;
    let content = chat_resp
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default();

    Ok(content.trim().to_string())
}

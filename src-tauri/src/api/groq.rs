use reqwest::multipart;
use serde::Deserialize;
use std::sync::LazyLock;
use std::time::Duration;

use crate::errors::{Result, VoiceFlowError};

const GROQ_BASE_URL: &str = "https://api.groq.com/openai/v1";
const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);

/// Shared HTTP client with connection pooling and timeout.
static HTTP_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .build()
        .expect("Failed to build HTTP client")
});

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
    let file_part = multipart::Part::bytes(wav_data)
        .file_name("audio.wav")
        .mime_str("audio/wav")
        .map_err(|e| VoiceFlowError::Api(e.to_string()))?;

    let form = multipart::Form::new()
        .part("file", file_part)
        .text("model", model.to_string())
        .text("language", language.to_string())
        .text("response_format", "text".to_string());

    let resp = HTTP_CLIENT
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
pub async fn refine(
    api_key: &str,
    raw_text: &str,
    model: &str,
    language: &str,
) -> Result<String> {
    let system_prompt = build_refine_prompt(language);
    let payload = serde_json::json!({
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": raw_text
            }
        ],
        "temperature": 0.3,
        "max_tokens": 2048
    });

    let resp = HTTP_CLIENT
        .post(format!("{}/chat/completions", GROQ_BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
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

/// Build a language-aware system prompt for text refinement.
fn build_refine_prompt(language: &str) -> String {
    let base = "You are a dictation assistant for a software developer. \
        The user will give you raw speech-to-text output. \
        Fix grammar, punctuation, capitalization, and remove filler words (uh, um, like, né, tipo, então). \
        Keep the original meaning intact. Return ONLY the corrected text, nothing else.";

    let lang_hint = match language {
        "pt" => "\nThe user speaks Brazilian Portuguese but frequently uses English technical terms \
            (e.g. deploy, commit, pull request, branch, merge, frontend, backend, API, endpoint, \
            framework, runtime, build, pipeline, sprint, refactor, debug, cloud, cluster, container, \
            callback, middleware, hook, state, props, component, token, socket, stream, buffer). \
            Keep these English terms as-is — do NOT translate them to Portuguese. \
            Write the rest in correct Brazilian Portuguese.",
        "es" => "\nThe user speaks Spanish but may use English technical/programming terms. \
            Keep English technical terms as-is. Write the rest in correct Spanish.",
        "fr" => "\nThe user speaks French but may use English technical/programming terms. \
            Keep English technical terms as-is. Write the rest in correct French.",
        "de" => "\nThe user speaks German but may use English technical/programming terms. \
            Keep English technical terms as-is. Write the rest in correct German.",
        "it" => "\nThe user speaks Italian but may use English technical/programming terms. \
            Keep English technical terms as-is. Write the rest in correct Italian.",
        "ja" | "ko" | "zh" => "\nThe user may mix English technical/programming terms with their native language. \
            Keep English technical terms as-is. Write the rest in the user's language.",
        _ => "\nKeep the original language. If the user mixes English technical terms, preserve them as-is.",
    };

    format!("{}{}", base, lang_hint)
}

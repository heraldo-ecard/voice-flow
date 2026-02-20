use crate::api::groq;
use crate::audio::encoder;
use crate::commands::injector;
use crate::errors::{Result, VoiceFlowError};
use crate::AppState;
use serde::Serialize;
use std::time::Instant;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Clone, Serialize)]
pub struct PipelineResult {
    pub raw_text: String,
    pub refined_text: String,
    pub stt_latency_ms: u64,
    pub llm_latency_ms: u64,
    pub total_latency_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "state")]
pub enum PipelineState {
    #[serde(rename = "recording")]
    Recording,
    #[serde(rename = "encoding")]
    Encoding,
    #[serde(rename = "transcribing")]
    Transcribing,
    #[serde(rename = "refining")]
    Refining,
    #[serde(rename = "injecting")]
    Injecting,
    #[serde(rename = "idle")]
    Idle,
}

fn emit_state(app: &AppHandle, state: PipelineState) {
    let _ = app.emit("pipeline-state", &state);
}

#[tauri::command]
pub async fn start_recording(app: AppHandle) -> std::result::Result<(), String> {
    let state = app.state::<AppState>();
    let mut audio = state.audio.lock().map_err(|e| e.to_string())?;
    audio.start_recording().map_err(|e| e.to_string())?;
    emit_state(&app, PipelineState::Recording);
    Ok(())
}

#[tauri::command]
pub async fn stop_and_process(app: AppHandle) -> std::result::Result<PipelineResult, String> {
    let result = run_pipeline(&app).await;
    match &result {
        Ok(r) => {
            let _ = app.emit("pipeline-complete", r);
        }
        Err(_) => {}
    }
    // Hide overlay before going idle so the pill never shows empty
    super::overlay::hide_overlay(&app);
    emit_state(&app, PipelineState::Idle);
    result.map_err(|e| e.to_string())
}

async fn run_pipeline(app: &AppHandle) -> Result<PipelineResult> {
    let t_start = Instant::now();

    // 1. Stop recording and get samples
    let (samples, sample_rate) = {
        let state = app.state::<AppState>();
        let mut audio = state
            .audio
            .lock()
            .map_err(|e| VoiceFlowError::Pipeline(format!("Audio lock poisoned: {}", e)))?;
        audio.stop_recording()?
    };

    if samples.is_empty() {
        return Err(VoiceFlowError::Pipeline("No audio recorded".into()));
    }

    // 2. Encode WAV
    emit_state(app, PipelineState::Encoding);
    let wav_data = encoder::encode_wav(&samples, sample_rate)?;

    // 3. Get settings - API key always from keychain, other settings from DB
    let api_key = crate::keychain::get_api_key().unwrap_or_default();

    if api_key.is_empty() {
        return Err(VoiceFlowError::Pipeline(
            "No API key configured. Set it in Settings.".into(),
        ));
    }

    let (stt_model, llm_model, language) = {
        let state = app.state::<AppState>();
        let db = state
            .db
            .lock()
            .map_err(|e| VoiceFlowError::Pipeline(format!("DB lock poisoned: {}", e)))?;
        let stt_model = db
            .get_setting("stt_model")
            .ok()
            .flatten()
            .unwrap_or_else(|| "whisper-large-v3".to_string());
        let llm_model = db
            .get_setting("llm_model")
            .ok()
            .flatten()
            .unwrap_or_else(|| "llama-3.3-70b-versatile".to_string());
        let language = db
            .get_setting("language")
            .ok()
            .flatten()
            .unwrap_or_else(|| "pt".to_string());
        (stt_model, llm_model, language)
    };

    // 4. Transcribe
    emit_state(app, PipelineState::Transcribing);
    let t_stt = Instant::now();
    let raw_text = groq::transcribe(&api_key, wav_data, &stt_model, &language).await?;
    let stt_latency = t_stt.elapsed().as_millis() as u64;

    if raw_text.is_empty() {
        return Err(VoiceFlowError::Pipeline("Empty transcription".into()));
    }

    // 5. Refine with LLM
    emit_state(app, PipelineState::Refining);
    let t_llm = Instant::now();
    let refined_text = groq::refine(&api_key, &raw_text, &llm_model, &language).await?;
    let llm_latency = t_llm.elapsed().as_millis() as u64;

    // 6. Inject text into the currently focused input field
    emit_state(app, PipelineState::Injecting);
    injector::inject_text(&refined_text)?;

    let total_latency = t_start.elapsed().as_millis() as u64;

    // 7. Save to database (log errors instead of silently ignoring)
    {
        let state = app.state::<AppState>();
        let db_result = state.db.lock();
        if let Ok(db) = db_result {
            if let Err(e) =
                db.save_transcription(&raw_text, &refined_text, stt_latency, llm_latency)
            {
                log::error!("Failed to save transcription to DB: {}", e);
            }
        }
    }

    let result = PipelineResult {
        raw_text,
        refined_text,
        stt_latency_ms: stt_latency,
        llm_latency_ms: llm_latency,
        total_latency_ms: total_latency,
    };

    log::info!(
        "Pipeline complete in {}ms (STT: {}ms, LLM: {}ms)",
        total_latency,
        stt_latency,
        llm_latency
    );

    Ok(result)
}

use tauri::AppHandle;

/// Register global hotkeys for the app.
/// Hold-to-talk: press Ctrl+Shift+Space starts recording, release stops and processes.
pub fn register_hotkeys(app: &AppHandle) -> crate::errors::Result<()> {
    use tauri_plugin_global_shortcut::{
        Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
    };

    let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);

    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _shortcut, event| {
            let app = app.clone();
            match event.state {
                ShortcutState::Pressed => {
                    log::info!("Hotkey pressed - starting recording");
                    tauri::async_runtime::spawn(async move {
                        on_hotkey_press(&app).await;
                    });
                }
                ShortcutState::Released => {
                    log::info!("Hotkey released - stopping and processing");
                    tauri::async_runtime::spawn(async move {
                        on_hotkey_release(&app).await;
                    });
                }
            }
        })
        .map_err(|e| crate::errors::VoiceFlowError::Pipeline(e.to_string()))?;

    log::info!("Global hotkey registered: Ctrl+Shift+Space (hold-to-talk)");
    Ok(())
}

/// On hotkey press: start recording if not already recording.
async fn on_hotkey_press(app: &AppHandle) {
    use tauri::Manager;

    let is_recording = {
        let state = app.state::<crate::AppState>();
        let lock_result = state.audio.lock();
        match lock_result {
            Ok(audio) => audio.is_recording(),
            Err(_) => return,
        }
    };

    if !is_recording {
        match crate::commands::pipeline::start_recording(app.clone()).await {
            Ok(_) => {
                log::info!("Recording started via hotkey");
                // Show overlay and start emitting audio levels
                crate::commands::overlay::show_overlay(app);
                crate::commands::overlay::start_audio_level_emitter(app.clone());
            }
            Err(e) => {
                log::error!("Recording start error: {}", e);
                let _ = tauri::Emitter::emit(app, "pipeline-error", e);
            }
        }
    }
}

/// On hotkey release: stop recording and process the pipeline.
async fn on_hotkey_release(app: &AppHandle) {
    use tauri::Manager;

    let is_recording = {
        let state = app.state::<crate::AppState>();
        let lock_result = state.audio.lock();
        match lock_result {
            Ok(audio) => audio.is_recording(),
            Err(_) => return,
        }
    };

    if is_recording {
        match crate::commands::pipeline::stop_and_process(app.clone()).await {
            Ok(_) => log::info!("Pipeline completed via hotkey release"),
            Err(e) => {
                log::error!("Pipeline error: {}", e);
                let _ = tauri::Emitter::emit(app, "pipeline-error", e);
            }
        }
    }
}

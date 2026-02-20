use tauri::AppHandle;

/// Register global hotkeys for the app.
/// Default: Ctrl+Shift+Space for toggle recording.
pub fn register_hotkeys(app: &AppHandle) -> crate::errors::Result<()> {
    use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

    let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);

    app.global_shortcut().on_shortcut(shortcut, move |app, _shortcut, event| {
        match event.state {
            ShortcutState::Pressed => {
                log::info!("Hotkey pressed - toggling recording");
                let app = app.clone();
                tauri::async_runtime::spawn(async move {
                    toggle_recording(&app).await;
                });
            }
            ShortcutState::Released => {}
        }
    }).map_err(|e| crate::errors::VoiceFlowError::Pipeline(e.to_string()))?;

    log::info!("Global hotkey registered: Ctrl+Shift+Space");
    Ok(())
}

async fn toggle_recording(app: &AppHandle) {
    use tauri::Manager;

    let is_recording = {
        let state = app.state::<crate::AppState>();
        let audio = state.audio.lock().unwrap();
        audio.is_recording()
    };

    if is_recording {
        match crate::commands::pipeline::stop_and_process(app.clone()).await {
            Ok(_) => log::info!("Pipeline completed via hotkey"),
            Err(e) => {
                log::error!("Pipeline error: {}", e);
                let _ = tauri::Emitter::emit(app, "pipeline-error", e);
            }
        }
    } else {
        match crate::commands::pipeline::start_recording(app.clone()).await {
            Ok(_) => log::info!("Recording started via hotkey"),
            Err(e) => {
                log::error!("Recording start error: {}", e);
                let _ = tauri::Emitter::emit(app, "pipeline-error", e);
            }
        }
    }
}

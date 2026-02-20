use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::AppState;

/// Create and show the floating overlay window at the bottom center of the screen.
pub fn show_overlay(app: &AppHandle) {
    // Don't create if already exists
    if app.get_webview_window("overlay").is_some() {
        return;
    }

    let (x, y) = get_overlay_position(app);

    match WebviewWindowBuilder::new(app, "overlay", WebviewUrl::App("index.html".into()))
        .title("VoiceFlow")
        .inner_size(200.0, 40.0)
        .position(x, y)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .always_on_top(true)
        .resizable(false)
        .skip_taskbar(true)
        .focused(false)
        .build()
    {
        Ok(_) => log::info!("Overlay window created"),
        Err(e) => log::error!("Failed to create overlay window: {}", e),
    }
}

/// Close the overlay window.
pub fn hide_overlay(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.close();
        log::info!("Overlay window closed");
    }
}

/// Start emitting audio level events every 50ms while recording.
/// Runs on a background thread and stops automatically when recording stops.
pub fn start_audio_level_emitter(app: AppHandle) {
    std::thread::spawn(move || {
        loop {
            let should_continue = {
                let state = app.state::<AppState>();
                let lock_result = state.audio.lock();
                match lock_result {
                    Ok(audio) => {
                        if audio.is_recording() {
                            let level = audio.get_level();
                            drop(audio);
                            let _ = app.emit("audio-level", level);
                            true
                        } else {
                            false
                        }
                    }
                    Err(_) => false,
                }
            };

            if !should_continue {
                break;
            }

            std::thread::sleep(std::time::Duration::from_millis(50));
        }
    });
}

/// Calculate overlay position: bottom center of the primary monitor.
fn get_overlay_position(app: &AppHandle) -> (f64, f64) {
    let overlay_width = 200.0;
    let overlay_height = 40.0;
    let bottom_margin = 48.0;

    // Try to get monitor info from the main window
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(Some(monitor)) = window.current_monitor() {
            let size = monitor.size();
            let scale = monitor.scale_factor();
            let x = (size.width as f64 / scale - overlay_width) / 2.0;
            let y = size.height as f64 / scale - overlay_height - bottom_margin;
            return (x, y);
        }
    }

    // Fallback: reasonable default
    (560.0, 700.0)
}

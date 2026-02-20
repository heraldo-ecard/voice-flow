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
        .inner_size(138.0, 32.0)
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

/// Calculate overlay position: bottom center of the current monitor.
fn get_overlay_position(app: &AppHandle) -> (f64, f64) {
    let overlay_width = 138.0;
    let overlay_height = 32.0;
    let bottom_margin = 48.0;

    // Try current monitor of main window, fall back to primary monitor
    let monitor = app
        .get_webview_window("main")
        .and_then(|w| w.current_monitor().ok().flatten())
        .or_else(|| app.primary_monitor().ok().flatten());

    if let Some(monitor) = monitor {
        let size = monitor.size();
        let pos = monitor.position();
        let scale = monitor.scale_factor();

        // Convert physical pixels → logical pixels, including monitor offset
        let monitor_x = pos.x as f64 / scale;
        let monitor_y = pos.y as f64 / scale;
        let monitor_w = size.width as f64 / scale;
        let monitor_h = size.height as f64 / scale;

        let x = monitor_x + (monitor_w - overlay_width) / 2.0;
        let y = monitor_y + monitor_h - overlay_height - bottom_margin;
        return (x, y);
    }

    // Fallback: reasonable default
    (560.0, 700.0)
}

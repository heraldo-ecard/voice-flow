use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    AppHandle, Manager,
};

use crate::errors::{Result, VoiceFlowError};

// Tray icon PNG bytes — embedded at compile time
const TRAY_IDLE: &[u8] = include_bytes!("../../icons/tray-idle.png");
const TRAY_RECORDING: &[u8] = include_bytes!("../../icons/tray-recording.png");
const TRAY_PROCESSING: &[u8] = include_bytes!("../../icons/tray-processing.png");

/// ID used to retrieve the tray icon handle from anywhere in the app.
pub const TRAY_ID: &str = "voiceflow-tray";

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum TrayState {
    Idle,
    Recording,
    Processing,
}

/// Decode PNG bytes to a Tauri `Image` (raw RGBA).
fn png_to_image(bytes: &[u8]) -> Option<Image<'static>> {
    use image::GenericImageView;
    let img = image::load_from_memory(bytes).ok()?;
    let rgba = img.to_rgba8();
    let (width, height) = img.dimensions();
    Some(Image::new_owned(rgba.into_raw(), width, height))
}

pub fn create_tray(app: &AppHandle) -> Result<TrayIcon> {
    let quit = MenuItem::with_id(app, "quit", "Quit VoiceFlow", true, None::<&str>)
        .map_err(|e| VoiceFlowError::Pipeline(e.to_string()))?;
    let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)
        .map_err(|e| VoiceFlowError::Pipeline(e.to_string()))?;

    let menu = Menu::with_items(app, &[&show, &quit])
        .map_err(|e| VoiceFlowError::Pipeline(e.to_string()))?;

    let icon = png_to_image(TRAY_IDLE)
        .unwrap_or_else(|| {
            app.default_window_icon()
                .cloned()
                .unwrap_or_else(|| Image::new_owned(vec![0u8; 4], 1, 1))
        });

    let tray = TrayIconBuilder::with_id(TRAY_ID)
        .menu(&menu)
        .tooltip("VoiceFlow - Idle")
        .icon(icon)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        .build(app)
        .map_err(|e| VoiceFlowError::Pipeline(e.to_string()))?;

    Ok(tray)
}

/// Update the tray icon and tooltip to reflect the current pipeline state.
/// Retrieves the tray handle by ID — no-op if the tray is unavailable.
pub fn update_tray_state(app: &AppHandle, state: TrayState) {
    let Some(tray) = app.tray_by_id(TRAY_ID) else {
        return;
    };

    let (icon_bytes, tooltip) = match state {
        TrayState::Idle       => (TRAY_IDLE,       "VoiceFlow - Idle"),
        TrayState::Recording  => (TRAY_RECORDING,  "VoiceFlow - Recording..."),
        TrayState::Processing => (TRAY_PROCESSING, "VoiceFlow - Processing..."),
    };

    if let Some(icon) = png_to_image(icon_bytes) {
        let _ = tray.set_icon(Some(icon));
    }
    let _ = tray.set_tooltip(Some(tooltip));
}

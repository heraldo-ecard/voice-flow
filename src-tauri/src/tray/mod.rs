use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    AppHandle, Manager,
};

use crate::errors::{Result, VoiceFlowError};

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum TrayState {
    Idle,
    Recording,
    Processing,
}

pub fn create_tray(app: &AppHandle) -> Result<TrayIcon> {
    let quit = MenuItem::with_id(app, "quit", "Quit VoiceFlow", true, None::<&str>)
        .map_err(|e| VoiceFlowError::Pipeline(e.to_string()))?;
    let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)
        .map_err(|e| VoiceFlowError::Pipeline(e.to_string()))?;

    let menu = Menu::with_items(app, &[&show, &quit])
        .map_err(|e| VoiceFlowError::Pipeline(e.to_string()))?;

    let icon = app
        .default_window_icon()
        .cloned()
        .unwrap_or_else(|| Image::new_owned(vec![0u8; 4], 1, 1));

    let tray = TrayIconBuilder::new()
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

pub fn update_tray_state(tray: &TrayIcon, _app: &AppHandle, state: TrayState) -> Result<()> {
    let tooltip = match state {
        TrayState::Idle => "VoiceFlow - Idle",
        TrayState::Recording => "VoiceFlow - Recording...",
        TrayState::Processing => "VoiceFlow - Processing...",
    };

    tray.set_tooltip(Some(tooltip))
        .map_err(|e| VoiceFlowError::Pipeline(e.to_string()))?;

    Ok(())
}

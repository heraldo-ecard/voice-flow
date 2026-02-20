mod api;
mod audio;
mod commands;
mod errors;
mod hotkey;
pub mod keychain;
mod storage;
mod tray;

use audio::capture::AudioState;
use std::sync::Mutex;
use storage::database::Database;
use tauri::Manager;

pub struct AppState {
    pub audio: Mutex<AudioState>,
    pub db: Mutex<Database>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize database
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join("voiceflow.db");
            let db = Database::new(db_path.to_str().unwrap())
                .expect("Failed to initialize database");

            // Set up app state
            app.manage(AppState {
                audio: Mutex::new(AudioState::new()),
                db: Mutex::new(db),
            });

            // Create system tray
            let _tray = tray::create_tray(app.handle())
                .unwrap_or_else(|e| {
                    log::error!("Failed to create tray: {}", e);
                    panic!("Tray creation failed");
                });

            // Register hotkeys
            hotkey::register_hotkeys(app.handle())
                .unwrap_or_else(|e| {
                    log::error!("Failed to register hotkeys: {}", e);
                });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::pipeline::start_recording,
            commands::pipeline::stop_and_process,
            commands::storage::get_transcriptions,
            commands::storage::delete_transcription,
            commands::storage::get_stats,
            commands::storage::get_setting,
            commands::storage::set_setting,
            keychain::save_api_key,
            keychain::load_api_key,
            keychain::remove_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

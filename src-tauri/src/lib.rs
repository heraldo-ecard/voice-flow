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
    // Load .env file if present
    let _ = dotenvy::dotenv();
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            // Enable logging in all builds (Info for debug, Warn for release)
            let log_level = if cfg!(debug_assertions) {
                log::LevelFilter::Info
            } else {
                log::LevelFilter::Warn
            };
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log_level)
                    .build(),
            )?;

            // Initialize database (safe path handling for non-UTF8 paths)
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join("voiceflow.db");
            let db_path_str = db_path.to_string_lossy();
            let db = Database::new(&db_path_str)
                .expect("Failed to initialize database");

            // Seed API key from environment variable if not already in keychain
            if keychain::get_api_key().is_err() {
                if let Ok(env_key) = std::env::var("GROQ_API_KEY") {
                    if !env_key.is_empty() {
                        let _ = keychain::set_api_key(&env_key);
                        log::info!("API key loaded from GROQ_API_KEY env var");
                    }
                }
            }

            // Set up app state
            app.manage(AppState {
                audio: Mutex::new(AudioState::new()),
                db: Mutex::new(db),
            });

            // Create system tray (graceful fallback if tray unavailable)
            match tray::create_tray(app.handle()) {
                Ok(_tray) => log::info!("System tray created"),
                Err(e) => log::warn!("Tray unavailable, continuing without it: {}", e),
            }

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

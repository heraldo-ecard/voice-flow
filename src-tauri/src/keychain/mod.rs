use crate::errors::Result;
use keyring::Entry;

const SERVICE_NAME: &str = "voice-flow";

pub fn set_api_key(key: &str) -> Result<()> {
    let entry = Entry::new(SERVICE_NAME, "groq_api_key")?;
    entry.set_password(key)?;
    log::info!("API key stored in keychain");
    Ok(())
}

pub fn get_api_key() -> Result<String> {
    let entry = Entry::new(SERVICE_NAME, "groq_api_key")?;
    let key = entry.get_password()?;
    Ok(key)
}

pub fn delete_api_key() -> Result<()> {
    let entry = Entry::new(SERVICE_NAME, "groq_api_key")?;
    entry.delete_credential()?;
    log::info!("API key removed from keychain");
    Ok(())
}

// Tauri commands for keychain access
#[tauri::command]
pub fn save_api_key(key: String) -> std::result::Result<(), String> {
    set_api_key(&key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_api_key() -> std::result::Result<String, String> {
    get_api_key().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_api_key() -> std::result::Result<(), String> {
    delete_api_key().map_err(|e| e.to_string())
}

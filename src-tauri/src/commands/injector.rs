use crate::errors::{Result, VoiceFlowError};
use arboard::Clipboard;
use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use std::thread;
use std::time::Duration;

/// Inject text into the currently focused field.
/// First tries enigo typing, falls back to clipboard paste.
pub fn inject_text(text: &str) -> Result<()> {
    // Use clipboard-based injection for reliability across apps
    clipboard_inject(text)
}

/// Clipboard-based injection: copy text then simulate Ctrl+V.
fn clipboard_inject(text: &str) -> Result<()> {
    let mut clipboard =
        Clipboard::new().map_err(|e| VoiceFlowError::Injection(e.to_string()))?;

    // Save current clipboard content
    let previous = clipboard.get_text().ok();

    // Set our text
    clipboard
        .set_text(text.to_string())
        .map_err(|e| VoiceFlowError::Injection(e.to_string()))?;

    thread::sleep(Duration::from_millis(50));

    // Simulate Ctrl+V
    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| VoiceFlowError::Injection(e.to_string()))?;

    enigo
        .key(Key::Control, Direction::Press)
        .map_err(|e| VoiceFlowError::Injection(e.to_string()))?;
    enigo
        .key(Key::Unicode('v'), Direction::Click)
        .map_err(|e| VoiceFlowError::Injection(e.to_string()))?;
    enigo
        .key(Key::Control, Direction::Release)
        .map_err(|e| VoiceFlowError::Injection(e.to_string()))?;

    thread::sleep(Duration::from_millis(100));

    // Restore previous clipboard content
    if let Some(prev) = previous {
        let _ = clipboard.set_text(prev);
    }

    log::info!("Text injected ({} chars)", text.len());
    Ok(())
}

use crate::errors::{Result, VoiceFlowError};
use arboard::Clipboard;
use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use std::thread;
use std::time::Duration;

/// Inject text into the currently focused input field via clipboard paste (Ctrl+V).
/// Saves and restores clipboard content after injection.
pub fn inject_text(text: &str) -> Result<()> {
    let mut clipboard =
        Clipboard::new().map_err(|e| VoiceFlowError::Injection(e.to_string()))?;

    // Save current clipboard text (best effort - non-text content will be lost)
    let previous = clipboard.get_text().ok();

    // Set our text to clipboard
    clipboard
        .set_text(text.to_string())
        .map_err(|e| VoiceFlowError::Injection(e.to_string()))?;

    thread::sleep(Duration::from_millis(50));

    // Simulate Ctrl+V to paste into the focused field
    let paste_result = simulate_paste();

    // Wait for paste to complete before restoring
    thread::sleep(Duration::from_millis(150));

    // Always restore previous clipboard content (even if paste failed)
    if let Some(prev) = previous {
        let _ = clipboard.set_text(prev);
    }

    // Now propagate any paste error
    paste_result?;

    log::info!("Text injected ({} chars)", text.len());
    Ok(())
}

fn simulate_paste() -> Result<()> {
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

    Ok(())
}

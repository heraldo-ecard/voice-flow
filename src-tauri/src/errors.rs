use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum VoiceFlowError {
    #[error("Audio error: {0}")]
    Audio(String),

    #[error("API error: {0}")]
    Api(String),

    #[error("Database error: {0}")]
    Database(String),

    #[error("Keychain error: {0}")]
    Keychain(String),

    #[error("Injection error: {0}")]
    Injection(String),

    #[error("Pipeline error: {0}")]
    Pipeline(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

impl Serialize for VoiceFlowError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<reqwest::Error> for VoiceFlowError {
    fn from(e: reqwest::Error) -> Self {
        VoiceFlowError::Api(e.to_string())
    }
}

impl From<rusqlite::Error> for VoiceFlowError {
    fn from(e: rusqlite::Error) -> Self {
        VoiceFlowError::Database(e.to_string())
    }
}

impl From<keyring::Error> for VoiceFlowError {
    fn from(e: keyring::Error) -> Self {
        VoiceFlowError::Keychain(e.to_string())
    }
}

pub type Result<T> = std::result::Result<T, VoiceFlowError>;

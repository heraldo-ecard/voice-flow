use rusqlite::{params, Connection};
use uuid::Uuid;

use crate::errors::Result;
use crate::storage::models::{Transcription, TranscriptionStats};

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Self { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        self.conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS transcriptions (
                id TEXT PRIMARY KEY,
                raw_text TEXT NOT NULL,
                refined_text TEXT NOT NULL,
                stt_latency_ms INTEGER NOT NULL,
                llm_latency_ms INTEGER NOT NULL,
                word_count INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_transcriptions_created
                ON transcriptions(created_at DESC);
            ",
        )?;
        Ok(())
    }

    pub fn save_transcription(
        &self,
        raw_text: &str,
        refined_text: &str,
        stt_latency_ms: u64,
        llm_latency_ms: u64,
    ) -> Result<String> {
        let id = Uuid::new_v4().to_string();
        let word_count = refined_text.split_whitespace().count() as i64;

        self.conn.execute(
            "INSERT INTO transcriptions (id, raw_text, refined_text, stt_latency_ms, llm_latency_ms, word_count)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, raw_text, refined_text, stt_latency_ms as i64, llm_latency_ms as i64, word_count],
        )?;

        log::info!("Saved transcription {} ({} words)", id, word_count);
        Ok(id)
    }

    pub fn get_transcriptions(
        &self,
        limit: i64,
        offset: i64,
        search: Option<&str>,
    ) -> Result<Vec<Transcription>> {
        let mut results = Vec::new();

        if let Some(query) = search {
            let pattern = format!("%{}%", query);
            let mut stmt = self.conn.prepare(
                "SELECT id, raw_text, refined_text, stt_latency_ms, llm_latency_ms, word_count, created_at
                 FROM transcriptions
                 WHERE refined_text LIKE ?1 OR raw_text LIKE ?1
                 ORDER BY created_at DESC
                 LIMIT ?2 OFFSET ?3",
            )?;

            let rows = stmt.query_map(params![pattern, limit, offset], |row| {
                Ok(Transcription {
                    id: row.get(0)?,
                    raw_text: row.get(1)?,
                    refined_text: row.get(2)?,
                    stt_latency_ms: row.get(3)?,
                    llm_latency_ms: row.get(4)?,
                    word_count: row.get(5)?,
                    created_at: row.get(6)?,
                })
            })?;

            for row in rows {
                results.push(row?);
            }
        } else {
            let mut stmt = self.conn.prepare(
                "SELECT id, raw_text, refined_text, stt_latency_ms, llm_latency_ms, word_count, created_at
                 FROM transcriptions
                 ORDER BY created_at DESC
                 LIMIT ?1 OFFSET ?2",
            )?;

            let rows = stmt.query_map(params![limit, offset], |row| {
                Ok(Transcription {
                    id: row.get(0)?,
                    raw_text: row.get(1)?,
                    refined_text: row.get(2)?,
                    stt_latency_ms: row.get(3)?,
                    llm_latency_ms: row.get(4)?,
                    word_count: row.get(5)?,
                    created_at: row.get(6)?,
                })
            })?;

            for row in rows {
                results.push(row?);
            }
        }

        Ok(results)
    }

    pub fn delete_transcription(&self, id: &str) -> Result<()> {
        self.conn
            .execute("DELETE FROM transcriptions WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_stats(&self) -> Result<TranscriptionStats> {
        let total_transcriptions: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM transcriptions", [], |row| row.get(0))?;

        let total_words: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(word_count), 0) FROM transcriptions",
            [],
            |row| row.get(0),
        )?;

        let words_today: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(word_count), 0) FROM transcriptions WHERE date(created_at) = date('now')",
            [],
            |row| row.get(0),
        )?;

        let words_this_week: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(word_count), 0) FROM transcriptions WHERE created_at >= datetime('now', '-7 days')",
            [],
            |row| row.get(0),
        )?;

        let words_this_month: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(word_count), 0) FROM transcriptions WHERE created_at >= datetime('now', '-30 days')",
            [],
            |row| row.get(0),
        )?;

        let avg_stt_latency_ms: f64 = self.conn.query_row(
            "SELECT COALESCE(AVG(stt_latency_ms), 0) FROM transcriptions",
            [],
            |row| row.get(0),
        )?;

        let avg_llm_latency_ms: f64 = self.conn.query_row(
            "SELECT COALESCE(AVG(llm_latency_ms), 0) FROM transcriptions",
            [],
            |row| row.get(0),
        )?;

        Ok(TranscriptionStats {
            total_transcriptions,
            total_words,
            words_today,
            words_this_week,
            words_this_month,
            avg_stt_latency_ms,
            avg_llm_latency_ms,
        })
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let result = self.conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |row| row.get(0),
        );

        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_crud() {
        let db = Database::new(":memory:").unwrap();

        // Save
        let id = db.save_transcription("hello world", "Hello, world!", 100, 200).unwrap();
        assert!(!id.is_empty());

        // Get
        let transcriptions = db.get_transcriptions(10, 0, None).unwrap();
        assert_eq!(transcriptions.len(), 1);
        assert_eq!(transcriptions[0].refined_text, "Hello, world!");
        assert_eq!(transcriptions[0].word_count, 2);

        // Search
        let found = db.get_transcriptions(10, 0, Some("Hello")).unwrap();
        assert_eq!(found.len(), 1);

        let not_found = db.get_transcriptions(10, 0, Some("xyz123")).unwrap();
        assert_eq!(not_found.len(), 0);

        // Stats
        let stats = db.get_stats().unwrap();
        assert_eq!(stats.total_transcriptions, 1);
        assert_eq!(stats.total_words, 2);

        // Delete
        db.delete_transcription(&id).unwrap();
        let after_delete = db.get_transcriptions(10, 0, None).unwrap();
        assert_eq!(after_delete.len(), 0);
    }

    #[test]
    fn test_settings() {
        let db = Database::new(":memory:").unwrap();

        assert_eq!(db.get_setting("api_key").unwrap(), None);

        db.set_setting("api_key", "test-key").unwrap();
        assert_eq!(db.get_setting("api_key").unwrap(), Some("test-key".to_string()));

        db.set_setting("api_key", "new-key").unwrap();
        assert_eq!(db.get_setting("api_key").unwrap(), Some("new-key".to_string()));
    }
}

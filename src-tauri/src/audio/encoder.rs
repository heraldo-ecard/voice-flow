use crate::errors::{Result, VoiceFlowError};
use std::io::Cursor;

const TARGET_SAMPLE_RATE: u32 = 16000;

/// Resample audio to 16kHz if needed, then encode as WAV (16-bit mono).
pub fn encode_wav(samples: &[f32], source_rate: u32) -> Result<Vec<u8>> {
    let resampled = if source_rate != TARGET_SAMPLE_RATE {
        resample(samples, source_rate, TARGET_SAMPLE_RATE)
    } else {
        samples.to_vec()
    };

    let mut cursor = Cursor::new(Vec::new());
    let spec = hound::WavSpec {
        channels: 1,
        sample_rate: TARGET_SAMPLE_RATE,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut writer =
        hound::WavWriter::new(&mut cursor, spec).map_err(|e| VoiceFlowError::Audio(e.to_string()))?;

    for &sample in &resampled {
        let clamped = sample.clamp(-1.0, 1.0);
        let int_sample = (clamped * 32767.0) as i16;
        writer
            .write_sample(int_sample)
            .map_err(|e| VoiceFlowError::Audio(e.to_string()))?;
    }

    writer
        .finalize()
        .map_err(|e| VoiceFlowError::Audio(e.to_string()))?;

    Ok(cursor.into_inner())
}

/// Simple linear interpolation resampling.
fn resample(samples: &[f32], from_rate: u32, to_rate: u32) -> Vec<f32> {
    if samples.is_empty() {
        return Vec::new();
    }

    let ratio = from_rate as f64 / to_rate as f64;
    let output_len = (samples.len() as f64 / ratio) as usize;
    let mut output = Vec::with_capacity(output_len);

    for i in 0..output_len {
        let src_idx = i as f64 * ratio;
        let idx = src_idx as usize;
        let frac = (src_idx - idx as f64) as f32;

        let sample = if idx + 1 < samples.len() {
            samples[idx] * (1.0 - frac) + samples[idx + 1] * frac
        } else {
            samples[idx.min(samples.len() - 1)]
        };
        output.push(sample);
    }

    output
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_wav_produces_valid_wav() {
        // 1 second of silence at 16kHz
        let samples = vec![0.0f32; 16000];
        let wav = encode_wav(&samples, 16000).unwrap();

        // WAV header starts with RIFF
        assert_eq!(&wav[0..4], b"RIFF");
        assert!(wav.len() > 44); // header + data
    }

    #[test]
    fn test_resample_halves_rate() {
        let samples: Vec<f32> = (0..1000).map(|i| (i as f32 / 1000.0).sin()).collect();
        let resampled = resample(&samples, 48000, 16000);
        // Output should be roughly 1/3 of input
        let expected_len = (1000.0 * 16000.0 / 48000.0) as usize;
        assert!((resampled.len() as i64 - expected_len as i64).abs() <= 1);
    }
}

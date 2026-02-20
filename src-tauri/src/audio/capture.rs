use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::SampleFormat;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex};

use crate::errors::{Result, VoiceFlowError};

/// Thread-safe audio sample buffer shared between the recording thread and main thread.
type SampleBuffer = Arc<Mutex<Vec<f32>>>;

/// Audio recording state. The cpal Stream is managed on a dedicated thread
/// (because cpal Stream is not Send+Sync), controlled via channels.
/// All fields of AudioState itself are Send+Sync.
pub struct AudioState {
    samples: SampleBuffer,
    recording: Arc<std::sync::atomic::AtomicBool>,
    /// Current audio RMS level (f32 stored as u32 bits for atomic access).
    level: Arc<AtomicU32>,
    sample_rate: u32,
    stop_signal: Option<std::sync::mpsc::Sender<()>>,
    join_handle: Option<std::thread::JoinHandle<()>>,
}

impl Default for AudioState {
    fn default() -> Self {
        Self::new()
    }
}

impl AudioState {
    pub fn new() -> Self {
        Self {
            samples: Arc::new(Mutex::new(Vec::new())),
            recording: Arc::new(std::sync::atomic::AtomicBool::new(false)),
            level: Arc::new(AtomicU32::new(0)),
            sample_rate: 0,
            stop_signal: None,
            join_handle: None,
        }
    }

    /// Get the current audio RMS level (0.0 to ~1.0).
    pub fn get_level(&self) -> f32 {
        f32::from_bits(self.level.load(Ordering::Relaxed))
    }

    pub fn is_recording(&self) -> bool {
        self.recording.load(std::sync::atomic::Ordering::Relaxed)
    }

    pub fn start_recording(&mut self) -> Result<()> {
        if self.is_recording() {
            return Ok(());
        }

        // Clear previous samples
        if let Ok(mut samples) = self.samples.lock() {
            samples.clear();
        }

        let host = cpal::default_host();
        let device = host
            .default_input_device()
            .ok_or_else(|| VoiceFlowError::Audio("No input device found".into()))?;

        let config = device
            .default_input_config()
            .map_err(|e| VoiceFlowError::Audio(e.to_string()))?;

        self.sample_rate = config.sample_rate().0;
        let channels = config.channels() as usize;
        let sample_format = config.sample_format();

        let samples = self.samples.clone();
        let recording = self.recording.clone();
        let level = self.level.clone();
        let (stop_tx, stop_rx) = std::sync::mpsc::channel::<()>();
        self.stop_signal = Some(stop_tx);

        recording.store(true, std::sync::atomic::Ordering::Relaxed);

        // Spawn a dedicated thread for the audio stream
        let handle = std::thread::spawn(move || {
            let stream = match sample_format {
                SampleFormat::F32 => {
                    let samples = samples.clone();
                    let level = level.clone();
                    device.build_input_stream(
                        &config.into(),
                        move |data: &[f32], _: &cpal::InputCallbackInfo| {
                            let mut rms_sum = 0.0f32;
                            let mut count = 0usize;
                            if let Ok(mut buf) = samples.lock() {
                                for chunk in data.chunks(channels) {
                                    let mono: f32 =
                                        chunk.iter().sum::<f32>() / channels as f32;
                                    buf.push(mono);
                                    rms_sum += mono * mono;
                                    count += 1;
                                }
                            }
                            if count > 0 {
                                let rms = (rms_sum / count as f32).sqrt();
                                level.store(rms.to_bits(), Ordering::Relaxed);
                            }
                        },
                        |err| log::error!("Audio stream error: {}", err),
                        None,
                    )
                }
                SampleFormat::I16 => {
                    let samples = samples.clone();
                    let level = level.clone();
                    device.build_input_stream(
                        &config.into(),
                        move |data: &[i16], _: &cpal::InputCallbackInfo| {
                            let mut rms_sum = 0.0f32;
                            let mut count = 0usize;
                            if let Ok(mut buf) = samples.lock() {
                                for chunk in data.chunks(channels) {
                                    let mono: f32 = chunk
                                        .iter()
                                        .map(|&s| s as f32 / 32768.0)
                                        .sum::<f32>()
                                        / channels as f32;
                                    buf.push(mono);
                                    rms_sum += mono * mono;
                                    count += 1;
                                }
                            }
                            if count > 0 {
                                let rms = (rms_sum / count as f32).sqrt();
                                level.store(rms.to_bits(), Ordering::Relaxed);
                            }
                        },
                        |err| log::error!("Audio stream error: {}", err),
                        None,
                    )
                }
                _ => {
                    log::error!("Unsupported sample format: {:?}", sample_format);
                    recording.store(false, std::sync::atomic::Ordering::Relaxed);
                    return;
                }
            };

            match stream {
                Ok(stream) => {
                    if let Err(e) = stream.play() {
                        log::error!("Failed to play stream: {}", e);
                        recording.store(false, std::sync::atomic::Ordering::Relaxed);
                        return;
                    }
                    log::info!("Audio stream started");
                    // Block until stop signal
                    let _ = stop_rx.recv();
                    // Stream is dropped here, stopping recording
                    recording.store(false, std::sync::atomic::Ordering::Relaxed);
                    log::info!("Audio stream stopped");
                }
                Err(e) => {
                    log::error!("Failed to build stream: {}", e);
                    recording.store(false, std::sync::atomic::Ordering::Relaxed);
                }
            }
        });

        self.join_handle = Some(handle);
        log::info!("Recording started at {} Hz", self.sample_rate);
        Ok(())
    }

    pub fn stop_recording(&mut self) -> Result<(Vec<f32>, u32)> {
        // Send stop signal to recording thread
        if let Some(stop_tx) = self.stop_signal.take() {
            let _ = stop_tx.send(());
        }

        // Wait for the recording thread to finish (proper join, no arbitrary sleep)
        if let Some(handle) = self.join_handle.take() {
            let _ = handle.join();
        }

        let samples = if let Ok(mut buf) = self.samples.lock() {
            std::mem::take(&mut *buf)
        } else {
            Vec::new()
        };

        log::info!("Recording stopped, {} samples captured", samples.len());
        Ok((samples, self.sample_rate))
    }
}

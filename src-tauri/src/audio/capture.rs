use std::sync::{Arc, Mutex};

/// Shared audio buffer that the cpal callback writes to.
/// This is Send+Sync and can be stored in Tauri state.
#[derive(Clone)]
pub struct AudioBuffer {
    pub samples: Arc<Mutex<Vec<f32>>>,
    pub sample_rate: u32,
    pub channels: u16,
}

impl AudioBuffer {
    pub fn new(sample_rate: u32, channels: u16) -> Self {
        Self {
            samples: Arc::new(Mutex::new(Vec::new())),
            sample_rate,
            channels,
        }
    }

    pub fn clear(&self) {
        self.samples.lock().unwrap().clear();
    }

    pub fn take(&self) -> Vec<f32> {
        let mut buf = self.samples.lock().unwrap();
        std::mem::take(&mut *buf)
    }
}

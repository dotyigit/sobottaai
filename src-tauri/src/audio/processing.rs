/// Converts multi-channel audio to mono by averaging channels.
pub fn to_mono(samples: &[f32], channels: u16) -> Vec<f32> {
    if channels == 1 {
        return samples.to_vec();
    }
    samples
        .chunks_exact(channels as usize)
        .map(|frame| frame.iter().sum::<f32>() / channels as f32)
        .collect()
}

/// Linear interpolation resampler from source_rate to target_rate (16000 Hz).
pub fn resample(samples: &[f32], source_rate: u32, target_rate: u32) -> Vec<f32> {
    if source_rate == target_rate {
        return samples.to_vec();
    }
    let ratio = source_rate as f64 / target_rate as f64;
    let output_len = (samples.len() as f64 / ratio) as usize;
    let mut output = Vec::with_capacity(output_len);

    for i in 0..output_len {
        let src_idx = i as f64 * ratio;
        let idx = src_idx as usize;
        let frac = src_idx - idx as f64;

        let sample = if idx + 1 < samples.len() {
            samples[idx] as f64 * (1.0 - frac) + samples[idx + 1] as f64 * frac
        } else if idx < samples.len() {
            samples[idx] as f64
        } else {
            0.0
        };
        output.push(sample as f32);
    }

    output
}

/// Normalize audio to peak amplitude of ~0.95 to ensure Whisper gets usable levels.
pub fn normalize(samples: &mut [f32]) {
    let max = samples.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
    if max < 0.001 {
        // Audio is essentially silence — don't amplify noise
        return;
    }
    let gain = 0.95 / max;
    // Cap the gain to avoid amplifying quiet noise too much (max ~30x / ~30dB boost)
    let gain = gain.min(30.0);
    for s in samples.iter_mut() {
        *s *= gain;
    }
}

/// Full preprocessing pipeline: multi-channel -> mono -> 16kHz -> normalize.
pub fn preprocess(samples: &[f32], channels: u16, sample_rate: u32) -> Vec<f32> {
    let mono = to_mono(samples, channels);
    let mut resampled = resample(&mono, sample_rate, 16000);
    normalize(&mut resampled);
    resampled
}

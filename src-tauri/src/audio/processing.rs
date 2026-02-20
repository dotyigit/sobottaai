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

/// Compute the RMS (root-mean-square) energy of audio samples.
/// Returns 0.0 for empty input.
pub fn rms_energy(samples: &[f32]) -> f32 {
    if samples.is_empty() {
        return 0.0;
    }
    (samples.iter().map(|s| s * s).sum::<f32>() / samples.len() as f32).sqrt()
}

/// Full preprocessing pipeline: multi-channel -> mono -> 16kHz -> normalize.
pub fn preprocess(samples: &[f32], channels: u16, sample_rate: u32) -> Vec<f32> {
    let mono = to_mono(samples, channels);
    let mut resampled = resample(&mono, sample_rate, 16000);
    normalize(&mut resampled);
    resampled
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── to_mono ──────────────────────────────────────────────

    #[test]
    fn to_mono_single_channel_is_identity() {
        let input = vec![0.1, 0.2, 0.3, 0.4];
        let result = to_mono(&input, 1);
        assert_eq!(result, input);
    }

    #[test]
    fn to_mono_stereo_averages_channels() {
        // Stereo: [L, R, L, R, ...]
        let input = vec![0.2, 0.8, 0.4, 0.6, 1.0, 0.0];
        let result = to_mono(&input, 2);
        assert_eq!(result.len(), 3);
        assert!((result[0] - 0.5).abs() < 1e-6); // (0.2+0.8)/2
        assert!((result[1] - 0.5).abs() < 1e-6); // (0.4+0.6)/2
        assert!((result[2] - 0.5).abs() < 1e-6); // (1.0+0.0)/2
    }

    #[test]
    fn to_mono_four_channels() {
        let input = vec![0.4, 0.4, 0.4, 0.4]; // one frame of 4 channels
        let result = to_mono(&input, 4);
        assert_eq!(result.len(), 1);
        assert!((result[0] - 0.4).abs() < 1e-6);
    }

    #[test]
    fn to_mono_empty_input() {
        let result = to_mono(&[], 2);
        assert!(result.is_empty());
    }

    // ── resample ─────────────────────────────────────────────

    #[test]
    fn resample_same_rate_is_identity() {
        let input = vec![0.1, 0.2, 0.3];
        let result = resample(&input, 16000, 16000);
        assert_eq!(result, input);
    }

    #[test]
    fn resample_downsample_halves_length() {
        // 32kHz → 16kHz should roughly halve the number of samples
        let input: Vec<f32> = (0..1000).map(|i| (i as f32) / 1000.0).collect();
        let result = resample(&input, 32000, 16000);
        assert_eq!(result.len(), 500);
    }

    #[test]
    fn resample_upsample_doubles_length() {
        // 8kHz → 16kHz should roughly double the number of samples
        let input: Vec<f32> = (0..100).map(|i| (i as f32) / 100.0).collect();
        let result = resample(&input, 8000, 16000);
        assert_eq!(result.len(), 200);
    }

    #[test]
    fn resample_44100_to_16000() {
        // Common real-world sample rate
        let input: Vec<f32> = (0..44100).map(|i| (i as f32 * 0.001).sin()).collect();
        let result = resample(&input, 44100, 16000);
        let expected_len = (44100.0 / (44100.0 / 16000.0)) as usize;
        assert_eq!(result.len(), expected_len);
    }

    #[test]
    fn resample_48000_to_16000() {
        let input: Vec<f32> = (0..48000).map(|i| (i as f32 * 0.001).sin()).collect();
        let result = resample(&input, 48000, 16000);
        assert_eq!(result.len(), 16000);
    }

    #[test]
    fn resample_preserves_dc_signal() {
        // A constant signal should remain constant after resampling
        let input = vec![0.5f32; 1000];
        let result = resample(&input, 44100, 16000);
        for s in &result {
            assert!((s - 0.5).abs() < 1e-6);
        }
    }

    #[test]
    fn resample_empty_input() {
        let result = resample(&[], 44100, 16000);
        assert!(result.is_empty());
    }

    // ── normalize ────────────────────────────────────────────

    #[test]
    fn normalize_scales_to_target() {
        let mut samples = vec![0.0, 0.5, -0.5, 0.25];
        normalize(&mut samples);
        // Peak was 0.5 → gain = 0.95 / 0.5 = 1.9
        assert!((samples[1] - 0.95).abs() < 1e-6);
        assert!((samples[2] - (-0.95)).abs() < 1e-6);
        assert!((samples[3] - 0.475).abs() < 1e-6);
    }

    #[test]
    fn normalize_already_at_target() {
        let mut samples = vec![0.0, 0.95, -0.95];
        normalize(&mut samples);
        // Gain = 0.95 / 0.95 = 1.0
        assert!((samples[1] - 0.95).abs() < 1e-6);
    }

    #[test]
    fn normalize_silence_stays_silent() {
        let mut samples = vec![0.0, 0.0001, -0.0001];
        let original = samples.clone();
        normalize(&mut samples);
        // max < 0.001, so nothing changes
        assert_eq!(samples, original);
    }

    #[test]
    fn normalize_very_quiet_caps_gain() {
        // Very quiet audio — gain should be capped at 30x
        let mut samples = vec![0.01, -0.01];
        normalize(&mut samples);
        // Without cap: gain = 0.95/0.01 = 95x
        // With cap: gain = 30x → 0.01 * 30 = 0.30
        assert!((samples[0] - 0.30).abs() < 1e-6);
        assert!((samples[1] - (-0.30)).abs() < 1e-6);
    }

    #[test]
    fn normalize_single_sample() {
        let mut samples = vec![0.5];
        normalize(&mut samples);
        assert!((samples[0] - 0.95).abs() < 1e-6);
    }

    #[test]
    fn normalize_empty_input() {
        let mut samples: Vec<f32> = vec![];
        normalize(&mut samples); // should not panic
        assert!(samples.is_empty());
    }

    // ── preprocess (full pipeline) ───────────────────────────

    #[test]
    fn preprocess_mono_16k_only_normalizes() {
        let input = vec![0.0, 0.5, -0.5, 0.25];
        let result = preprocess(&input, 1, 16000);
        // Already mono and 16kHz, so only normalization happens
        assert_eq!(result.len(), 4);
        assert!((result[1] - 0.95).abs() < 1e-6);
    }

    #[test]
    fn preprocess_stereo_44100_full_pipeline() {
        // Stereo at 44100Hz
        let input: Vec<f32> = (0..88200)
            .map(|i| if i % 2 == 0 { 0.5 } else { -0.5 })
            .collect();
        let result = preprocess(&input, 2, 44100);
        // 44100 stereo frames → 44100 mono → ~16000 resampled
        let expected_mono_len = 44100;
        let expected_resampled = (expected_mono_len as f64 / (44100.0 / 16000.0)) as usize;
        assert_eq!(result.len(), expected_resampled);
    }

    #[test]
    fn preprocess_output_is_normalized() {
        let input = vec![0.1, 0.1, 0.2, 0.2]; // stereo, 2 frames
        let result = preprocess(&input, 2, 16000);
        // After mono: [0.1, 0.2], normalize: peak=0.2, gain=0.95/0.2=4.75
        assert_eq!(result.len(), 2);
        let peak = result.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
        assert!((peak - 0.95).abs() < 1e-5);
    }
}

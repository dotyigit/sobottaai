use hound::{SampleFormat, WavSpec, WavWriter};
use std::io::Cursor;
use std::path::Path;

pub fn save_wav(samples: &[f32], sample_rate: u32, path: &Path) -> anyhow::Result<()> {
    let spec = WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 32,
        sample_format: SampleFormat::Float,
    };
    let mut writer = WavWriter::create(path, spec)?;
    for &sample in samples {
        writer.write_sample(sample)?;
    }
    writer.finalize()?;
    Ok(())
}

pub fn encode_wav_to_bytes(samples: &[f32], sample_rate: u32) -> anyhow::Result<Vec<u8>> {
    let spec = WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 32,
        sample_format: SampleFormat::Float,
    };
    let mut cursor = Cursor::new(Vec::new());
    {
        let mut writer = WavWriter::new(&mut cursor, spec)?;
        for &sample in samples {
            writer.write_sample(sample)?;
        }
        writer.finalize()?;
    }
    Ok(cursor.into_inner())
}

pub fn read_wav_file(path: &Path) -> anyhow::Result<(Vec<f32>, u32, u16)> {
    let reader = hound::WavReader::open(path)?;
    let spec = reader.spec();
    let sample_rate = spec.sample_rate;
    let channels = spec.channels;

    let samples: Vec<f32> = match spec.sample_format {
        SampleFormat::Float => reader.into_samples::<f32>().filter_map(|s| s.ok()).collect(),
        SampleFormat::Int => {
            let max = (1i64 << (spec.bits_per_sample - 1)) as f32;
            reader
                .into_samples::<i32>()
                .filter_map(|s| s.ok())
                .map(|s| s as f32 / max)
                .collect()
        }
    };

    Ok((samples, sample_rate, channels))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn test_samples() -> Vec<f32> {
        // Generate a short sine wave
        (0..160)
            .map(|i| (i as f32 * 0.1).sin() * 0.8)
            .collect()
    }

    #[test]
    fn save_and_read_wav_roundtrip() {
        let samples = test_samples();
        let dir = std::env::temp_dir().join("sobotta_test_wav");
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("roundtrip.wav");

        save_wav(&samples, 16000, &path).unwrap();
        let (read_samples, rate, channels) = read_wav_file(&path).unwrap();

        assert_eq!(rate, 16000);
        assert_eq!(channels, 1);
        assert_eq!(read_samples.len(), samples.len());
        for (a, b) in samples.iter().zip(read_samples.iter()) {
            assert!((a - b).abs() < 1e-6, "sample mismatch: {} vs {}", a, b);
        }

        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn encode_wav_to_bytes_produces_valid_wav() {
        let samples = test_samples();
        let bytes = encode_wav_to_bytes(&samples, 16000).unwrap();

        // WAV files start with "RIFF" magic bytes
        assert_eq!(&bytes[0..4], b"RIFF");
        // Followed by file size and "WAVE"
        assert_eq!(&bytes[8..12], b"WAVE");
        // Should be non-trivial size
        assert!(bytes.len() > 44); // 44 = WAV header size
    }

    #[test]
    fn encode_and_decode_wav_bytes_roundtrip() {
        let samples = test_samples();
        let bytes = encode_wav_to_bytes(&samples, 16000).unwrap();

        // Write bytes to a temp file and read back
        let dir = std::env::temp_dir().join("sobotta_test_wav");
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("bytes_roundtrip.wav");
        std::fs::write(&path, &bytes).unwrap();

        let (read_samples, rate, channels) = read_wav_file(&path).unwrap();
        assert_eq!(rate, 16000);
        assert_eq!(channels, 1);
        assert_eq!(read_samples.len(), samples.len());

        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn save_wav_different_sample_rates() {
        let samples = test_samples();
        let dir = std::env::temp_dir().join("sobotta_test_wav_rates");
        std::fs::create_dir_all(&dir).unwrap();

        for rate in [8000, 16000, 22050, 44100, 48000] {
            let path = dir.join(format!("test_{}.wav", rate));
            save_wav(&samples, rate, &path).unwrap();
            let (_, read_rate, _) = read_wav_file(&path).unwrap();
            assert_eq!(read_rate, rate);
        }

        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn save_wav_empty_samples() {
        let dir = std::env::temp_dir().join("sobotta_test_wav_empty");
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("empty.wav");

        save_wav(&[], 16000, &path).unwrap();
        let (samples, rate, channels) = read_wav_file(&path).unwrap();
        assert_eq!(rate, 16000);
        assert_eq!(channels, 1);
        assert!(samples.is_empty());

        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn read_wav_nonexistent_file_returns_error() {
        let path = PathBuf::from("/tmp/sobotta_nonexistent_file_12345.wav");
        assert!(read_wav_file(&path).is_err());
    }

    #[test]
    fn encode_wav_preserves_extreme_values() {
        let samples = vec![-1.0, -0.5, 0.0, 0.5, 1.0];
        let bytes = encode_wav_to_bytes(&samples, 16000).unwrap();

        let dir = std::env::temp_dir().join("sobotta_test_wav_extreme");
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("extreme.wav");
        std::fs::write(&path, &bytes).unwrap();

        let (read_samples, _, _) = read_wav_file(&path).unwrap();
        assert_eq!(read_samples.len(), 5);
        for (a, b) in samples.iter().zip(read_samples.iter()) {
            assert!((a - b).abs() < 1e-6);
        }

        std::fs::remove_dir_all(&dir).ok();
    }
}

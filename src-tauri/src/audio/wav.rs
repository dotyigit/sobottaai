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

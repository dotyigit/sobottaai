fn main() {
    // On macOS, copy sherpa-onnx dylibs to a fixed location so the
    // `bundle.macOS.frameworks` paths in tauri.conf.json resolve correctly
    // regardless of whether `--target <triple>` was passed to cargo.
    //
    // sherpa-rs-sys places dylibs in the profile directory derived from OUT_DIR,
    // which is `target/<triple>/release/` with --target but `target/release/`
    // without. We normalise by copying to `src-tauri/dylibs/`.
    #[cfg(target_os = "macos")]
    {
        let out_dir = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
        let profile = std::env::var("PROFILE").unwrap();

        // Walk up from OUT_DIR to find the profile directory (same logic as sherpa-rs-sys)
        let mut target_dir = None;
        let mut sub_path = out_dir.as_path();
        while let Some(parent) = sub_path.parent() {
            if parent.ends_with(&profile) {
                target_dir = Some(parent.to_path_buf());
                break;
            }
            sub_path = parent;
        }

        if let Some(target_dir) = target_dir {
            let dylibs_dir = std::path::Path::new("dylibs");
            let _ = std::fs::create_dir_all(dylibs_dir);

            for dylib in &["libonnxruntime.1.17.1.dylib", "libsherpa-onnx-c-api.dylib"] {
                let src = target_dir.join(dylib);
                let dst = dylibs_dir.join(dylib);
                if src.exists() {
                    let _ = std::fs::copy(&src, &dst);
                }
            }
        }
    }

    tauri_build::build()
}

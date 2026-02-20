fn main() {
    // macOS: copy sherpa-onnx dylibs to a fixed `dylibs/` directory so the
    // `bundle.macOS.frameworks` paths in tauri.conf.json resolve correctly
    // regardless of whether `--target <triple>` was passed to cargo.
    #[cfg(target_os = "macos")]
    {
        let out_dir = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
        let profile = std::env::var("PROFILE").unwrap();
        let dylib_names = ["libonnxruntime.1.17.1.dylib", "libsherpa-onnx-c-api.dylib"];

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

        let dylibs_dir = std::path::Path::new("dylibs");
        let _ = std::fs::create_dir_all(dylibs_dir);

        // Primary location: target profile dir populated by sherpa-rs-sys.
        if let Some(target_dir) = target_dir {
            for dylib in &dylib_names {
                let src = target_dir.join(dylib);
                let dst = dylibs_dir.join(dylib);
                if src.exists() {
                    let _ = std::fs::copy(&src, &dst);
                }
            }
        }

        // Fallback for clean CI builds: copy from sherpa-rs download cache.
        if let Some(home) = std::env::var_os("HOME") {
            let home = std::path::PathBuf::from(home);
            let cache_roots = [
                home.join("Library/Caches/sherpa-rs"),
                home.join(".cache/sherpa-rs"),
            ];

            for dylib in &dylib_names {
                let dst = dylibs_dir.join(dylib);
                if dst.exists() {
                    continue;
                }

                for root in &cache_roots {
                    if !root.exists() {
                        continue;
                    }
                    if let Some(src) = find_file_recursive(root, dylib) {
                        let _ = std::fs::copy(&src, &dst);
                        break;
                    }
                }
            }
        }

        for dylib in &dylib_names {
            let dst = dylibs_dir.join(dylib);
            if !dst.exists() {
                println!("cargo:warning=Missing required macOS dylib: {}", dylib);
            }
        }
    }

    tauri_build::build()
}

#[cfg(target_os = "macos")]
fn find_file_recursive(dir: &std::path::Path, filename: &str) -> Option<std::path::PathBuf> {
    let entries = std::fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(found) = find_file_recursive(&path, filename) {
                return Some(found);
            }
        } else if path.file_name().and_then(|n| n.to_str()) == Some(filename) {
            return Some(path);
        }
    }
    None
}

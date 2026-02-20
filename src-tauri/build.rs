fn main() {
    // On macOS, copy sherpa-onnx dylibs to a fixed location so the
    // `bundle.macOS.frameworks` paths in tauri.conf.json resolve correctly
    // regardless of whether `--target <triple>` was passed to cargo.
    //
    // sherpa-rs-sys places dylibs in the profile directory derived from OUT_DIR,
    // which is `target/<triple>/release/` with --target but `target/release/`
    // without. We normalise by copying to `src-tauri/dylibs/`.
    //
    // On clean builds (CI), the dylibs may not be in the target dir yet even
    // though sherpa-rs-sys's build.rs has run, because sherpa-rs-sys stores them
    // in a cache dir first. We search multiple locations:
    //   1. target/<profile>/ (normal local builds)
    //   2. sherpa-rs download cache (~/.cache/sherpa-rs/ or ~/Library/Caches/sherpa-rs/)
    #[cfg(target_os = "macos")]
    {
        let out_dir = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
        let profile = std::env::var("PROFILE").unwrap();

        let dylibs_dir = std::path::Path::new("dylibs");
        let _ = std::fs::create_dir_all(dylibs_dir);

        let dylib_names = &["libonnxruntime.1.17.1.dylib", "libsherpa-onnx-c-api.dylib"];

        // Walk up from OUT_DIR to find the profile directory
        let mut target_dir = None;
        let mut sub_path = out_dir.as_path();
        while let Some(parent) = sub_path.parent() {
            if parent.ends_with(&profile) {
                target_dir = Some(parent.to_path_buf());
                break;
            }
            sub_path = parent;
        }

        // Try copying from target dir first
        let mut all_found = true;
        if let Some(ref td) = target_dir {
            for dylib in dylib_names {
                let src = td.join(dylib);
                let dst = dylibs_dir.join(dylib);
                if src.exists() {
                    let _ = std::fs::copy(&src, &dst);
                } else if !dst.exists() {
                    all_found = false;
                }
            }
        } else {
            all_found = false;
        }

        // If any dylibs are still missing, search the sherpa-rs download cache
        if !all_found {
            if let Some(home) = std::env::var_os("HOME") {
                let home = std::path::PathBuf::from(home);
                // macOS uses ~/Library/Caches, Linux uses ~/.cache
                let cache_dirs = [
                    home.join("Library/Caches/sherpa-rs"),
                    home.join(".cache/sherpa-rs"),
                ];

                for cache_root in &cache_dirs {
                    if !cache_root.exists() {
                        continue;
                    }
                    // Search recursively for each missing dylib
                    for dylib in dylib_names {
                        let dst = dylibs_dir.join(dylib);
                        if dst.exists() {
                            continue;
                        }
                        if let Some(found) = find_file_recursive(cache_root, dylib) {
                            println!(
                                "cargo:warning=Found {} in cache: {}",
                                dylib,
                                found.display()
                            );
                            let _ = std::fs::copy(&found, &dst);
                        }
                    }
                }
            }
        }

        // Final check: if dylibs still missing, the build will fail in tauri_build
        for dylib in dylib_names {
            let dst = dylibs_dir.join(dylib);
            if !dst.exists() {
                println!(
                    "cargo:warning=Could not find {} — macOS bundle may fail",
                    dylib
                );
            }
        }
    }

    tauri_build::build()
}

#[cfg(target_os = "macos")]
fn find_file_recursive(dir: &std::path::Path, filename: &str) -> Option<std::path::PathBuf> {
    if let Ok(entries) = std::fs::read_dir(dir) {
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
    }
    None
}

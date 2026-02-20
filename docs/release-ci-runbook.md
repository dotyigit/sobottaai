# Release CI Runbook (Cross-Platform)

This document explains why SobottaAI release builds were failing across platforms and what made the pipeline stable again.

Reference workflow: `.github/workflows/release.yml`

Last known fully green run:
- GitHub Actions run: `22242417475`
- Tag: `v0.1.0`
- Status: macOS + Linux + Windows all successful

## What was failing

The root cause was `sherpa-rs-sys` native library resolution in clean CI environments.

Common errors we saw:
- macOS: `Library not found: dylibs/libonnxruntime.1.17.1.dylib`
- macOS/Linux: linker could not find `onnxruntime` / `sherpa-onnx-c-api`
- Windows: `LNK1181 cannot open input file 'cargs.lib'`
- Linux AppImage: `failed to run linuxdeploy` (FUSE not available on GitHub-hosted runners)

## Why this happened

1. `sherpa-rs-sys` downloads prebuilt native artifacts to cache paths that are not reliable to assume in CI.
2. Tauri/macOS framework checks happen early and require dylibs to already exist on disk.
3. Windows needed explicit native lib search paths for `.lib` files.
4. Linux AppImage requires FUSE/linuxdeploy behavior that is unreliable in hosted CI.

## Stable solution implemented

### 1) Pre-stage sherpa native artifacts per platform in CI

In `release.yml`, before `tauri-action`:
- macOS: download `sherpa-onnx-v1.12.9-osx-universal2-shared.tar.bz2` and copy:
  - `libonnxruntime.1.17.1.dylib`
  - `libonnxruntime.dylib`
  - `libsherpa-onnx-c-api.dylib`
  into `src-tauri/dylibs/`
- Linux: download `sherpa-onnx-v1.12.9-linux-x64-shared.tar.bz2` and copy:
  - `libonnxruntime.so`
  - `libsherpa-onnx-c-api.so`
  into `src-tauri/vendor/sherpa-linux/lib`
- Windows: download `sherpa-onnx-v1.12.9-win-x64-shared.tar.bz2` and copy full extracted content to:
  - `src-tauri/vendor/sherpa-win`

### 2) Force linker search paths with platform-specific `RUSTFLAGS`

`tauri-action` env now sets:
- macOS: `-L native=<workspace>/src-tauri/dylibs`
- Linux: `-L native=<workspace>/src-tauri/vendor/sherpa-linux/lib`
- Windows: `-L native=<workspace>/src-tauri/vendor/sherpa-win/lib`

This avoids reliance on unpredictable cache locations.

### 3) Linux packaging target changed

Linux matrix uses:
- `args: "--bundles deb,rpm"`

AppImage is intentionally skipped in CI because linuxdeploy/AppImage is FUSE-sensitive on hosted runners.

### 4) Keep macOS build native on macOS runner

For macOS matrix:
- `args: ""`
- `rust_target: aarch64-apple-darwin`

Using native build keeps paths and staging behavior simpler and more stable.

## If this breaks again

Use this quick checklist.

1. Verify archive version matches `sherpa-rs-sys` expectations
- Current pinned archive tag is `v1.12.9` (from `sherpa-rs-sys 0.6.8` dist table).
- If upgrading `sherpa-rs`/`sherpa-rs-sys`, update all three archive names in workflow.

2. Verify staged files actually exist before build step
- macOS: `src-tauri/dylibs/libonnxruntime.1.17.1.dylib`
- Linux: `src-tauri/vendor/sherpa-linux/lib/libonnxruntime.so`
- Windows: `src-tauri/vendor/sherpa-win/lib/sherpa-onnx-c-api.lib`

3. If linker says library not found
- Check corresponding `RUSTFLAGS` `-L native=...` path for that platform.
- Ensure path separators are valid for the runner OS.

4. If Linux fails in bundling stage with AppImage/linuxdeploy
- Confirm Linux args are still `--bundles deb,rpm`.
- Do not switch back to AppImage in hosted CI unless you also change runner strategy.

5. If macOS fails on `bundle.macOS.frameworks` validation
- Ensure pre-stage step still runs before `tauri-action`.
- Ensure `src-tauri/dylibs` contains required dylibs.

## Notes for future upgrades

- If/when `sherpa-rs-sys` publishes a release that fixes Windows linking behavior robustly, we can simplify this workflow by removing manual artifact staging.
- Until then, treat native artifact staging as required release infrastructure.

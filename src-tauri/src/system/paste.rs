use std::thread;
use std::time::Duration;

/// Simulates a paste keystroke (Cmd+V on macOS, Ctrl+V elsewhere).
pub fn simulate_paste() -> anyhow::Result<()> {
    // Small delay to ensure clipboard is ready
    thread::sleep(Duration::from_millis(50));

    #[cfg(target_os = "macos")]
    {
        // Use osascript instead of enigo on macOS.
        // enigo's CGEvent posting causes the Tauri app to exit.
        let status = std::process::Command::new("osascript")
            .arg("-e")
            .arg("tell application \"System Events\" to keystroke \"v\" using command down")
            .status()?;

        if !status.success() {
            anyhow::bail!("osascript exited with status: {}", status);
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        use enigo::{Direction, Enigo, Key, Keyboard, Settings};
        let mut enigo = Enigo::new(&Settings::default())?;
        enigo.key(Key::Control, Direction::Press)?;
        enigo.key(Key::Unicode('v'), Direction::Click)?;
        enigo.key(Key::Control, Direction::Release)?;
    }

    // Small delay to ensure the keystroke is delivered
    thread::sleep(Duration::from_millis(50));

    Ok(())
}

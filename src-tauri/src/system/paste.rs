use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use std::thread;
use std::time::Duration;

/// Simulates a paste keystroke (Cmd+V on macOS, Ctrl+V elsewhere).
pub fn simulate_paste() -> anyhow::Result<()> {
    let mut enigo = Enigo::new(&Settings::default())?;

    // Small delay to ensure clipboard is ready
    thread::sleep(Duration::from_millis(50));

    #[cfg(target_os = "macos")]
    {
        enigo.key(Key::Meta, Direction::Press)?;
        enigo.key(Key::Unicode('v'), Direction::Click)?;
        enigo.key(Key::Meta, Direction::Release)?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        enigo.key(Key::Control, Direction::Press)?;
        enigo.key(Key::Unicode('v'), Direction::Click)?;
        enigo.key(Key::Control, Direction::Release)?;
    }

    Ok(())
}

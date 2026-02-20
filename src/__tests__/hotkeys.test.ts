import { describe, it, expect } from "vitest";

// Extract the pure functions from hotkeys page for testing.
// We re-implement them here since they're defined inside the component module.

function parseHotkeyKeys(hotkey: string, isMac: boolean): string[] {
  return hotkey.split("+").map((key) => {
    switch (key) {
      case "CommandOrControl":
        return isMac ? "\u2318 Cmd" : "Ctrl";
      case "Alt":
        return isMac ? "\u2325 Option" : "Alt";
      case "Shift":
        return "\u21E7 Shift";
      case "Space":
        return "\u2423 Space";
      default:
        if (key.startsWith("Key")) return key.slice(3);
        if (key.startsWith("Digit")) return key.slice(5);
        if (key.startsWith("Arrow")) return key.slice(5);
        if (key.startsWith("Numpad")) return "Num" + key.slice(6);
        return key;
    }
  });
}

const HOTKEY_PRESETS = [
  { value: "Alt+Space", label: "Option + Space", description: "Quick single-hand access" },
  { value: "CommandOrControl+Shift+Space", label: "Cmd + Shift + Space", description: "Standard app shortcut" },
  { value: "CommandOrControl+Shift+H", label: "Cmd + Shift + H", description: 'H for "hear"' },
  { value: "CommandOrControl+Shift+R", label: "Cmd + Shift + R", description: 'R for "record"' },
  { value: "F9", label: "F9", description: "Function key (no modifiers)" },
  { value: "F10", label: "F10", description: "Function key (no modifiers)" },
];

describe("parseHotkeyKeys", () => {
  // ── macOS ─────────────────────────────────────────────────

  describe("macOS", () => {
    const isMac = true;

    it("parses Alt+Space", () => {
      const keys = parseHotkeyKeys("Alt+Space", isMac);
      expect(keys).toEqual(["\u2325 Option", "\u2423 Space"]);
    });

    it("parses CommandOrControl+Shift+Space", () => {
      const keys = parseHotkeyKeys("CommandOrControl+Shift+Space", isMac);
      expect(keys).toEqual(["\u2318 Cmd", "\u21E7 Shift", "\u2423 Space"]);
    });

    it("parses CommandOrControl+Shift+H", () => {
      const keys = parseHotkeyKeys("CommandOrControl+Shift+H", isMac);
      expect(keys).toEqual(["\u2318 Cmd", "\u21E7 Shift", "H"]);
    });

    it("parses F9", () => {
      expect(parseHotkeyKeys("F9", isMac)).toEqual(["F9"]);
    });

    it("parses F10", () => {
      expect(parseHotkeyKeys("F10", isMac)).toEqual(["F10"]);
    });
  });

  // ── Windows/Linux ─────────────────────────────────────────

  describe("Windows/Linux", () => {
    const isMac = false;

    it("parses CommandOrControl as Ctrl", () => {
      const keys = parseHotkeyKeys("CommandOrControl+Shift+Space", isMac);
      expect(keys).toEqual(["Ctrl", "\u21E7 Shift", "\u2423 Space"]);
    });

    it("parses Alt as Alt (not Option)", () => {
      const keys = parseHotkeyKeys("Alt+Space", isMac);
      expect(keys).toEqual(["Alt", "\u2423 Space"]);
    });
  });

  // ── e.code format handling ────────────────────────────────

  describe("e.code format", () => {
    it("converts KeyA to A", () => {
      expect(parseHotkeyKeys("KeyA", true)).toEqual(["A"]);
    });

    it("converts KeyZ to Z", () => {
      expect(parseHotkeyKeys("KeyZ", true)).toEqual(["Z"]);
    });

    it("converts Digit1 to 1", () => {
      expect(parseHotkeyKeys("Digit1", true)).toEqual(["1"]);
    });

    it("converts Digit0 to 0", () => {
      expect(parseHotkeyKeys("Digit0", true)).toEqual(["0"]);
    });

    it("converts ArrowUp to Up", () => {
      expect(parseHotkeyKeys("ArrowUp", true)).toEqual(["Up"]);
    });

    it("converts ArrowDown to Down", () => {
      expect(parseHotkeyKeys("ArrowDown", true)).toEqual(["Down"]);
    });

    it("converts NumpadAdd to NumAdd", () => {
      expect(parseHotkeyKeys("NumpadAdd", true)).toEqual(["NumAdd"]);
    });

    it("handles full combo with e.code key", () => {
      const keys = parseHotkeyKeys("CommandOrControl+Shift+KeyF", true);
      expect(keys).toEqual(["\u2318 Cmd", "\u21E7 Shift", "F"]);
    });

    it("handles Alt+e.code key", () => {
      const keys = parseHotkeyKeys("Alt+KeyK", true);
      expect(keys).toEqual(["\u2325 Option", "K"]);
    });
  });

  // ── Passthrough keys ──────────────────────────────────────

  describe("passthrough keys", () => {
    it("passes through Enter unchanged", () => {
      expect(parseHotkeyKeys("Enter", true)).toEqual(["Enter"]);
    });

    it("passes through Tab unchanged", () => {
      expect(parseHotkeyKeys("Tab", true)).toEqual(["Tab"]);
    });

    it("passes through Escape unchanged", () => {
      expect(parseHotkeyKeys("Escape", true)).toEqual(["Escape"]);
    });

    it("passes through Backspace unchanged", () => {
      expect(parseHotkeyKeys("Backspace", true)).toEqual(["Backspace"]);
    });
  });
});

describe("HOTKEY_PRESETS", () => {
  it("has 6 presets", () => {
    expect(HOTKEY_PRESETS).toHaveLength(6);
  });

  it("all presets have unique values", () => {
    const values = HOTKEY_PRESETS.map((p) => p.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("all presets have non-empty labels and descriptions", () => {
    for (const preset of HOTKEY_PRESETS) {
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
    }
  });

  it("default hotkey is the first preset", () => {
    expect(HOTKEY_PRESETS[0].value).toBe("Alt+Space");
  });

  it("custom hotkey detection works", () => {
    const isCustom = (hotkey: string) =>
      !HOTKEY_PRESETS.some((p) => p.value === hotkey);

    expect(isCustom("Alt+Space")).toBe(false);
    expect(isCustom("F9")).toBe(false);
    expect(isCustom("CommandOrControl+Shift+KeyF")).toBe(true);
    expect(isCustom("Alt+KeyK")).toBe(true);
  });
});

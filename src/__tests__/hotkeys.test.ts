import { describe, it, expect } from "vitest";
import { parseHotkeyKeys, formatHotkeyDisplay, getHotkeyPresets } from "@/lib/hotkey-utils";

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
      expect(keys).toEqual(["Ctrl", "Shift", "Space"]);
    });

    it("parses Alt as Alt (not Option)", () => {
      const keys = parseHotkeyKeys("Alt+Space", isMac);
      expect(keys).toEqual(["Alt", "Space"]);
    });

    it("does not include unicode symbols for Shift", () => {
      const keys = parseHotkeyKeys("Shift+KeyA", isMac);
      expect(keys).toEqual(["Shift", "A"]);
    });

    it("does not include unicode symbols for Space", () => {
      const keys = parseHotkeyKeys("Space", isMac);
      expect(keys).toEqual(["Space"]);
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

describe("formatHotkeyDisplay", () => {
  it("formats for macOS with symbols", () => {
    expect(formatHotkeyDisplay("Alt+Space", true)).toBe(
      "\u2325 Option + \u2423 Space"
    );
  });

  it("formats for Windows/Linux without symbols", () => {
    expect(formatHotkeyDisplay("Alt+Space", false)).toBe("Alt + Space");
  });

  it("formats complex combo for macOS", () => {
    expect(formatHotkeyDisplay("CommandOrControl+Shift+KeyF", true)).toBe(
      "\u2318 Cmd + \u21E7 Shift + F"
    );
  });

  it("formats complex combo for Windows/Linux", () => {
    expect(formatHotkeyDisplay("CommandOrControl+Shift+KeyF", false)).toBe(
      "Ctrl + Shift + F"
    );
  });
});

describe("getHotkeyPresets", () => {
  it("has 6 presets", () => {
    expect(getHotkeyPresets(true)).toHaveLength(6);
    expect(getHotkeyPresets(false)).toHaveLength(6);
  });

  it("all presets have unique values", () => {
    const values = getHotkeyPresets(true).map((p) => p.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("all presets have non-empty labels and descriptions", () => {
    for (const preset of getHotkeyPresets(true)) {
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
    }
  });

  it("default hotkey is the first preset", () => {
    expect(getHotkeyPresets(true)[0].value).toBe("Alt+Space");
  });

  it("custom hotkey detection works", () => {
    const presets = getHotkeyPresets(true);
    const isCustom = (hotkey: string) =>
      !presets.some((p) => p.value === hotkey);

    expect(isCustom("Alt+Space")).toBe(false);
    expect(isCustom("F9")).toBe(false);
    expect(isCustom("CommandOrControl+Shift+KeyF")).toBe(true);
    expect(isCustom("Alt+KeyK")).toBe(true);
  });

  it("shows macOS labels on macOS", () => {
    const presets = getHotkeyPresets(true);
    expect(presets[0].label).toBe("Option + Space");
    expect(presets[1].label).toBe("Cmd + Shift + Space");
  });

  it("shows Windows/Linux labels on non-Mac", () => {
    const presets = getHotkeyPresets(false);
    expect(presets[0].label).toBe("Alt + Space");
    expect(presets[1].label).toBe("Ctrl + Shift + Space");
  });
});

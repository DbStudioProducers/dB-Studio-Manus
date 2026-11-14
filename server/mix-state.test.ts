import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MixState } from "./mix-state";

describe("MixState", () => {
  it("starts with a usable personal mix", () => {
    const state = new MixState().getSnapshot();
    expect(state.revision).toBe(1);
    expect(state.channels).toHaveLength(6);
    expect(state.master).toBe(72);
  });

  it("updates channels and advances the revision", () => {
    const state = new MixState();
    const initial = state.getSnapshot();
    const next = state.updateChannel(
      1,
      { level: 91, muted: true },
      initial.revision
    );
    expect(next.revision).toBe(2);
    expect(next.channels.find(channel => channel.id === 1)).toMatchObject({
      level: 91,
      muted: true,
    });
  });

  it("rejects stale writes without mutating state", () => {
    const state = new MixState();
    state.updateMaster(65, 1);
    expect(() => state.updateMaster(40, 1)).toThrow("stale revision");
    expect(state.getSnapshot().master).toBe(65);
  });

  it("resets the complete mix", () => {
    const state = new MixState();
    state.updateChannel(3, { level: 12, pan: 88 });
    state.updateGlobalMute(true);
    const next = state.reset();
    expect(next.globalMute).toBe(false);
    expect(next.master).toBe(72);
    expect(next.channels.find(channel => channel.id === 3)).toMatchObject({
      level: 64,
      pan: -28,
    });
  });

  it("restores the last committed snapshot when persistence is enabled", () => {
    const directory = mkdtempSync(join(tmpdir(), "dbstudio-mix-"));
    const file = join(directory, "mix-state.json");
    try {
      const first = new MixState(file);
      first.updateMaster(61);
      const restored = new MixState(file).getSnapshot();
      expect(restored.master).toBe(61);
      expect(restored.revision).toBe(2);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

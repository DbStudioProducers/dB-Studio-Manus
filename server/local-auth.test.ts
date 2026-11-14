import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LocalAuth } from "./local-auth";

describe("LocalAuth", () => {
  it("creates the first technician and authenticates it", () => {
    const directory = mkdtempSync(join(tmpdir(), "dbstudio-auth-"));
    try {
      const auth = new LocalAuth(join(directory, "users.json"));
      const technician = auth.setupTechnician({
        username: "tech",
        password: "correct-horse-battery",
        displayName: "Técnico",
      });
      expect(technician.role).toBe("technician");
      expect(auth.isSetup()).toBe(true);
      const login = auth.login({ username: "TECH", password: "correct-horse-battery" });
      expect(login.token).toHaveLength(64);
      expect(auth.authenticate(`Bearer ${login.token}`)?.user.username).toBe("tech");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("binds a musician to its first authorized device", () => {
    const directory = mkdtempSync(join(tmpdir(), "dbstudio-auth-"));
    try {
      const auth = new LocalAuth(join(directory, "users.json"));
      auth.setupTechnician({ username: "tech", password: "correct-horse-battery", displayName: "Técnico" });
      const musician = auth.createUser({
        username: "rafa",
        password: "rafa-pass-1234",
        displayName: "Rafa",
        role: "musician",
        mixId: "mix-01",
      });
      expect(musician.deviceId).toBeNull();
      const firstLogin = auth.login({ username: "rafa", password: "rafa-pass-1234", deviceId: "iphone-rafa" });
      expect(firstLogin.user.deviceId).toBe("iphone-rafa");
      expect(() => auth.login({ username: "rafa", password: "rafa-pass-1234", deviceId: "other-phone" })).toThrow(
        "device is not authorized"
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects weak passwords and duplicate usernames", () => {
    const directory = mkdtempSync(join(tmpdir(), "dbstudio-auth-"));
    try {
      const auth = new LocalAuth(join(directory, "users.json"));
      expect(() => auth.setupTechnician({ username: "tech", password: "short", displayName: "Técnico" })).toThrow();
      auth.setupTechnician({ username: "tech", password: "correct-horse-battery", displayName: "Técnico" });
      expect(() => auth.createUser({
        username: "tech",
        password: "another-password",
        displayName: "Outro",
        role: "musician",
      })).toThrow("username already exists");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

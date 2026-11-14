import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

export type LocalRole = "technician" | "musician";

export type LocalUser = {
  id: string;
  username: string;
  displayName: string;
  role: LocalRole;
  mixId: string | null;
  deviceId: string | null;
  enabled: boolean;
  createdAt: string;
  passwordSalt: string;
  passwordHash: string;
};

type Session = {
  userId: string;
  expiresAt: number;
};

type PublicUser = Omit<LocalUser, "passwordSalt" | "passwordHash">;

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

function assertText(value: unknown, name: string, min: number, max: number) {
  if (typeof value !== "string" || value.length < min || value.length > max) {
    throw new Error(`${name} must contain between ${min} and ${max} characters`);
  }
  return value;
}

function normalizeUsername(value: unknown) {
  const username = assertText(value, "username", 3, 32).toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("username may contain only letters, numbers, dot, dash and underscore");
  }
  return username;
}

function hashPassword(password: string, saltHex = randomBytes(16).toString("hex")) {
  assertText(password, "password", 8, 128);
  const hash = scryptSync(password, Buffer.from(saltHex, "hex"), 32).toString("hex");
  return { saltHex, hash };
}

function verifyPassword(password: string, user: LocalUser) {
  try {
    const actual = scryptSync(password, Buffer.from(user.passwordSalt, "hex"), 32);
    const expected = Buffer.from(user.passwordHash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function publicUser(user: LocalUser): PublicUser {
  const { passwordSalt: _salt, passwordHash: _hash, ...safe } = user;
  return safe;
}

export class LocalAuth {
  private users: LocalUser[] = [];
  private readonly sessions = new Map<string, Session>();

  constructor(private readonly persistPath: string) {
    this.load();
  }

  isSetup() {
    return this.users.length > 0;
  }

  listUsers() {
    return this.users.map(publicUser);
  }

  setupTechnician(input: {
    username: unknown;
    password: unknown;
    displayName: unknown;
  }) {
    if (this.isSetup()) throw new Error("local authentication is already configured");
    return this.createUser({
      ...input,
      role: "technician",
      mixId: null,
      deviceId: null,
    });
  }

  createUser(input: {
    username: unknown;
    password: unknown;
    displayName: unknown;
    role: unknown;
    mixId?: unknown;
    deviceId?: unknown;
  }) {
    const username = normalizeUsername(input.username);
    if (this.users.some(user => user.username === username)) {
      throw new Error("username already exists");
    }
    const role = input.role === "technician" || input.role === "musician"
      ? input.role
      : (() => { throw new Error("role must be technician or musician"); })();
    const displayName = assertText(input.displayName, "displayName", 1, 80);
    const password = assertText(input.password, "password", 8, 128);
    const { saltHex, hash } = hashPassword(password);
    const user: LocalUser = {
      id: randomBytes(12).toString("hex"),
      username,
      displayName,
      role,
      mixId: role === "musician" ? String(input.mixId || "mix-01") : null,
      deviceId: role === "musician" && input.deviceId ? String(input.deviceId) : null,
      enabled: true,
      createdAt: new Date().toISOString(),
      passwordSalt: saltHex,
      passwordHash: hash,
    };
    this.users.push(user);
    this.persist();
    return publicUser(user);
  }

  login(input: { username: unknown; password: unknown; deviceId?: unknown }) {
    const username = normalizeUsername(input.username);
    const password = assertText(input.password, "password", 1, 128);
    const user = this.users.find(item => item.username === username);
    if (!user || !user.enabled || !verifyPassword(password, user)) {
      throw new Error("invalid username or password");
    }
    const deviceId = input.deviceId ? assertText(input.deviceId, "deviceId", 3, 128) : null;
    if (user.role === "musician" && user.deviceId && user.deviceId !== deviceId) {
      throw new Error("device is not authorized for this user");
    }
    if (user.role === "musician" && !user.deviceId && deviceId) {
      user.deviceId = deviceId;
      this.persist();
    }
    const token = randomBytes(32).toString("hex");
    this.sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS });
    return {
      token,
      expiresInSeconds: SESSION_TTL_MS / 1000,
      user: publicUser(user),
    };
  }

  authenticate(authorization: string | undefined) {
    if (!authorization?.startsWith("Bearer ")) return null;
    const token = authorization.slice("Bearer ".length).trim();
    const session = this.sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      this.sessions.delete(token);
      return null;
    }
    const user = this.users.find(item => item.id === session.userId);
    if (!user || !user.enabled) return null;
    return { token, user: publicUser(user) };
  }

  logout(authorization: string | undefined) {
    if (authorization?.startsWith("Bearer ")) {
      this.sessions.delete(authorization.slice("Bearer ".length).trim());
    }
  }

  updateUser(id: string, patch: { enabled?: unknown; deviceId?: unknown; mixId?: unknown }) {
    const user = this.users.find(item => item.id === id);
    if (!user) throw new Error("user not found");
    if (patch.enabled !== undefined) {
      if (typeof patch.enabled !== "boolean") throw new Error("enabled must be boolean");
      user.enabled = patch.enabled;
    }
    if (patch.deviceId !== undefined) {
      user.deviceId = patch.deviceId === null ? null : assertText(patch.deviceId, "deviceId", 3, 128);
    }
    if (patch.mixId !== undefined) {
      user.mixId = patch.mixId === null ? null : assertText(patch.mixId, "mixId", 1, 64);
    }
    this.persist();
    return publicUser(user);
  }

  private load() {
    try {
      const saved = JSON.parse(readFileSync(this.persistPath, "utf8")) as LocalUser[];
      if (Array.isArray(saved)) this.users = saved;
    } catch {
      this.users = [];
    }
  }

  private persist() {
    mkdirSync(dirname(this.persistPath), { recursive: true });
    writeFileSync(this.persistPath, JSON.stringify(this.users, null, 2), { mode: 0o600 });
  }
}

export type { PublicUser };

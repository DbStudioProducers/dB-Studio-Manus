export type MixChannel = {
  id: number;
  name: string;
  detail: string;
  level: number;
  pan: number;
  muted: boolean;
  color: string;
  icon: "mic" | "music";
};

export type MixSnapshot = {
  musician: string;
  mixName: string;
  master: number;
  globalMute: boolean;
  revision: number;
  updatedAt: string;
  channels: MixChannel[];
};

export type ChannelPatch = Partial<Pick<MixChannel, "level" | "pan" | "muted">>;

const defaultChannels: MixChannel[] = [
  {
    id: 1,
    name: "Vocal principal",
    detail: "Voz",
    level: 78,
    pan: 0,
    muted: false,
    color: "coral",
    icon: "mic",
  },
  {
    id: 2,
    name: "Vocal 2",
    detail: "Voz",
    level: 58,
    pan: -8,
    muted: false,
    color: "violet",
    icon: "mic",
  },
  {
    id: 3,
    name: "Guitarra",
    detail: "Banda",
    level: 64,
    pan: -28,
    muted: false,
    color: "amber",
    icon: "music",
  },
  {
    id: 4,
    name: "Baixo",
    detail: "Banda",
    level: 54,
    pan: 16,
    muted: false,
    color: "blue",
    icon: "music",
  },
  {
    id: 5,
    name: "Bumbo",
    detail: "Bateria",
    level: 48,
    pan: 0,
    muted: false,
    color: "orange",
    icon: "music",
  },
  {
    id: 6,
    name: "Click",
    detail: "Guias",
    level: 32,
    pan: 0,
    muted: false,
    color: "green",
    icon: "music",
  },
];

function cloneChannels() {
  return defaultChannels.map(channel => ({ ...channel }));
}

function assertNumber(value: unknown, name: string, min: number, max: number) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  ) {
    throw new Error(`${name} must be a number between ${min} and ${max}`);
  }
}

export class MixState {
  private snapshot: MixSnapshot = {
    musician: "Rafa",
    mixName: "Mix 01",
    master: 72,
    globalMute: false,
    revision: 1,
    updatedAt: new Date().toISOString(),
    channels: cloneChannels(),
  };

  constructor(private readonly persistPath: string | null = null) {
    if (!persistPath) return;
    try {
      const saved = JSON.parse(
        readFileSync(persistPath, "utf8")
      ) as MixSnapshot;
      if (
        saved &&
        Array.isArray(saved.channels) &&
        typeof saved.revision === "number"
      ) {
        this.snapshot = saved;
      }
    } catch {
      // Primeiro boot ou arquivo inválido: começa com a mixagem padrão.
    }
  }

  getSnapshot(): MixSnapshot {
    return {
      ...this.snapshot,
      channels: this.snapshot.channels.map(channel => ({ ...channel })),
    };
  }

  updateMaster(master: number, revision?: number) {
    this.assertRevision(revision);
    assertNumber(master, "master", 0, 100);
    this.snapshot.master = master;
    return this.commit();
  }

  updateGlobalMute(globalMute: boolean, revision?: number) {
    this.assertRevision(revision);
    if (typeof globalMute !== "boolean")
      throw new Error("globalMute must be boolean");
    this.snapshot.globalMute = globalMute;
    return this.commit();
  }

  updateChannel(id: number, patch: ChannelPatch, revision?: number) {
    this.assertRevision(revision);
    const channel = this.snapshot.channels.find(item => item.id === id);
    if (!channel) throw new Error("channel not found");
    if (patch.level !== undefined) {
      assertNumber(patch.level, "level", 0, 100);
      channel.level = patch.level;
    }
    if (patch.pan !== undefined) {
      assertNumber(patch.pan, "pan", -100, 100);
      channel.pan = patch.pan;
    }
    if (patch.muted !== undefined) {
      if (typeof patch.muted !== "boolean")
        throw new Error("muted must be boolean");
      channel.muted = patch.muted;
    }
    return this.commit();
  }

  reset(revision?: number) {
    this.assertRevision(revision);
    this.snapshot.master = 72;
    this.snapshot.globalMute = false;
    this.snapshot.channels = cloneChannels();
    return this.commit();
  }

  private assertRevision(revision?: number) {
    if (revision !== undefined && revision !== this.snapshot.revision) {
      const error = new Error("stale revision");
      (error as Error & { code?: string }).code = "STALE_REVISION";
      throw error;
    }
  }

  private commit() {
    this.snapshot.revision += 1;
    this.snapshot.updatedAt = new Date().toISOString();
    if (this.persistPath) {
      mkdirSync(dirname(this.persistPath), { recursive: true });
      writeFileSync(this.persistPath, JSON.stringify(this.snapshot, null, 2));
    }
    return this.getSnapshot();
  }
}
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

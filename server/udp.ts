import dgram from "node:dgram";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const MAGIC = Buffer.from("DBAU");
const VERSION = 1;
const HELLO = 1;
const ACK = 2;
const AUDIO = 3;

export type UdpAudioStatus = {
  enabled: boolean;
  state: "offline" | "listening" | "degraded";
  host: string;
  port: number;
  protocol: "DBAU/1";
  packetsReceived: number;
  packetsSent: number;
  audioPackets: number;
  droppedPackets: number;
  invalidPackets: number;
  lastPacketAt: string | null;
  clients: number;
};

type ClientKey = string;
type ClientSession = {
  highestSequence: number;
  lastSeenAt: string;
  token: Buffer;
};

function readPacket(message: Buffer) {
  if (message.length < 16 || !message.subarray(0, 4).equals(MAGIC)) return null;
  if (message.readUInt8(4) !== VERSION) return null;
  return {
    type: message.readUInt8(5),
    sequence: message.readUInt32BE(8),
    timestamp: message.readUInt32BE(12),
    payload: message.subarray(16),
  };
}

function makePacket(
  type: number,
  sequence: number,
  timestamp: number,
  payload: Uint8Array = new Uint8Array()
) {
  const packet = Buffer.alloc(16 + payload.length);
  MAGIC.copy(packet, 0);
  packet.writeUInt8(VERSION, 4);
  packet.writeUInt8(type, 5);
  packet.writeUInt16BE(0, 6);
  packet.writeUInt32BE(sequence >>> 0, 8);
  packet.writeUInt32BE(timestamp >>> 0, 12);
  Buffer.from(payload).copy(packet, 16);
  return packet;
}

export class UdpAudioTransport {
  private socket: dgram.Socket | null = null;
  private readonly enabled: boolean;
  private readonly port: number;
  private readonly clients = new Map<ClientKey, ClientSession>();
  private readonly pendingTokens = new Map<string, number>();
  private packetsReceived = 0;
  private packetsSent = 0;
  private audioPackets = 0;
  private droppedPackets = 0;
  private invalidPackets = 0;
  private lastPacketAt: string | null = null;
  private state: UdpAudioStatus["state"] = "offline";

  constructor() {
    this.enabled = process.env.UDP_AUDIO_ENABLED !== "0";
    this.port = Number(process.env.UDP_AUDIO_PORT || "5004");
  }

  async start() {
    if (!this.enabled) return;
    this.socket = dgram.createSocket("udp4");
    this.socket.on("message", (message, remote) =>
      this.handleMessage(message, remote)
    );
    this.socket.on("error", error => {
      this.state = "degraded";
      console.warn(`[UDP] ${error.message}`);
      this.socket?.close();
      this.socket = null;
    });

    await new Promise<void>(resolve => {
      const socket = this.socket;
      if (!socket) return resolve();
      const onListening = () => {
        socket.off("error", onErrorBeforeBind);
        this.state = "listening";
        resolve();
      };
      const onErrorBeforeBind = () => {
        socket.off("listening", onListening);
        this.state = "degraded";
        resolve();
      };
      socket.once("listening", onListening);
      socket.once("error", onErrorBeforeBind);
      socket.bind(this.port, "0.0.0.0");
    });

    if (this.state === "listening") {
      console.log(`[UDP] dB Audio transport listening on ${this.port}`);
    }
  }

  stop() {
    this.socket?.close();
    this.socket = null;
    this.state = "offline";
  }

  getStatus(): UdpAudioStatus {
    return {
      enabled: this.enabled,
      state: this.enabled ? this.state : "offline",
      host: "0.0.0.0",
      port: this.port,
      protocol: "DBAU/1",
      packetsReceived: this.packetsReceived,
      packetsSent: this.packetsSent,
      audioPackets: this.audioPackets,
      droppedPackets: this.droppedPackets,
      invalidPackets: this.invalidPackets,
      lastPacketAt: this.lastPacketAt,
      clients: this.clients.size,
    };
  }

  createJoinToken() {
    return `DB-${randomBytes(2).toString("hex").toUpperCase()}`;
  }

  createSessionToken() {
    const token = randomBytes(32);
    this.pendingTokens.set(token.toString("hex"), Date.now() + 5 * 60_000);
    return token.toString("hex");
  }

  private handleMessage(message: Buffer, remote: dgram.RemoteInfo) {
    const packet = readPacket(message);
    if (!packet) {
      this.invalidPackets += 1;
      return;
    }
    if (!this.socket) return;
    const client = `${remote.address}:${remote.port}`;
    this.packetsReceived += 1;
    this.lastPacketAt = new Date().toISOString();

    if (packet.type === HELLO) {
      if (packet.payload.length !== 32) {
        this.invalidPackets += 1;
        return;
      }
      const tokenKey = packet.payload.toString("hex");
      const expiresAt = this.pendingTokens.get(tokenKey);
      if (!expiresAt || expiresAt < Date.now()) {
        this.invalidPackets += 1;
        this.pendingTokens.delete(tokenKey);
        return;
      }
      this.pendingTokens.delete(tokenKey);
      this.clients.set(client, {
        highestSequence: packet.sequence,
        lastSeenAt: this.lastPacketAt,
        token: Buffer.from(packet.payload),
      });
      const ack = makePacket(ACK, packet.sequence, packet.timestamp);
      this.socket.send(ack, remote.port, remote.address, error => {
        if (!error) this.packetsSent += 1;
      });
    }

    if (packet.type === AUDIO && packet.payload.length > 0) {
      const session = this.clients.get(client);
      if (!session || packet.payload.length <= 32) {
        this.droppedPackets += 1;
        return;
      }
      const tag = packet.payload.subarray(0, 32);
      const audio = packet.payload.subarray(32);
      const expectedTag = createHmac("sha256", session.token)
        .update(message.subarray(0, 16))
        .update(audio)
        .digest();
      if (
        tag.length !== expectedTag.length ||
        !timingSafeEqual(tag, expectedTag) ||
        packet.sequence <= session.highestSequence
      ) {
        this.droppedPackets += 1;
        return;
      }
      session.highestSequence = packet.sequence;
      session.lastSeenAt = this.lastPacketAt;
      this.audioPackets += 1;
      // O áudio real será ligado ao audio-core nativo. O transporte já valida
      // o framing, mantém a sessão e fornece telemetria sem tocar na UI.
      void audio;
    }
  }

  createHelloPacket(token: string, sequence = 1) {
    return makePacket(
      HELLO,
      sequence,
      Date.now() >>> 0,
      Buffer.from(token, "hex")
    );
  }

  createAudioPacket(
    token: string,
    sequence: number,
    timestamp: number,
    payload: Buffer
  ) {
    const header = makePacket(AUDIO, sequence, timestamp);
    const tag = createHmac("sha256", Buffer.from(token, "hex"))
      .update(header)
      .update(payload)
      .digest();
    return makePacket(
      AUDIO,
      sequence,
      timestamp,
      Buffer.concat([tag, payload])
    );
  }
}

#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createSocket } from "node:dgram";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const port = Number(process.env.E2E_HTTP_PORT || 4317);
const udpPort = Number(process.env.E2E_UDP_PORT || 5517);
const base = `http://127.0.0.1:${port}`;
const stateDir = await mkdtemp(join(tmpdir(), "dbstudio-e2e-"));
const stateFile = join(stateDir, "mix-state.json");
let child;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForHealth() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {
      // O processo ainda está inicializando.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("servidor E2E não ficou pronto em 20s");
}

async function json(path, init) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json();
  assert(
    response.ok,
    `${init?.method ?? "GET"} ${path} retornou ${response.status}: ${JSON.stringify(body)}`
  );
  return body;
}

function waitForUdpAck(socket, portNumber) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("timeout aguardando ACK UDP"));
    }, 3_000);
    socket.once("message", message => {
      clearTimeout(timer);
      try {
        assert(
          message.subarray(0, 4).toString() === "DBAU",
          "ACK UDP sem magic DBAU"
        );
        assert(message.readUInt8(4) === 1, "ACK UDP com versão inválida");
        assert(message.readUInt8(5) === 2, "resposta UDP não é ACK");
        resolve(message);
      } catch (error) {
        reject(error);
      } finally {
        socket.close();
      }
    });
    const packet = Buffer.alloc(16);
    packet.write("DBAU", 0, "ascii");
    packet.writeUInt8(1, 4);
    packet.writeUInt8(1, 5);
    packet.writeUInt32BE(42, 8);
    packet.writeUInt32BE(Date.now() >>> 0, 12);
    socket.send(packet, portNumber, "127.0.0.1");
  });
}

async function main() {
  child = spawn(
    join(root, "node_modules", ".bin", "tsx"),
    ["watch", "server/_core/index.ts"],
    {
      cwd: root,
      env: {
        ...process.env,
        NODE_ENV: "development",
        PORT: String(port),
        UDP_AUDIO_PORT: String(udpPort),
        MIX_STATE_FILE: stateFile,
      },
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  child.stdout.on("data", chunk => process.stdout.write(`[server] ${chunk}`));
  child.stderr.on("data", chunk => process.stderr.write(`[server] ${chunk}`));

  await waitForHealth();
  const status = await json("/api/udp/status");
  assert(
    status.state === "listening",
    `UDP não está listening: ${status.state}`
  );
  assert(status.port === udpPort, `UDP usa porta inesperada: ${status.port}`);

  const initial = await json("/api/mix");
  assert(initial.channels.length === 6, "snapshot Expo não possui 6 canais");

  const channel = await json("/api/mix/channels/1", {
    method: "PATCH",
    body: JSON.stringify({ level: 91, muted: true }),
  });
  assert(
    channel.channels.find(item => item.id === 1)?.level === 91,
    "fader não foi aplicado"
  );
  assert(
    channel.channels.find(item => item.id === 1)?.muted === true,
    "mute de canal não foi aplicado"
  );

  const master = await json("/api/mix/master", {
    method: "PATCH",
    body: JSON.stringify({ master: 64 }),
  });
  assert(master.master === 64, "master não foi aplicado");

  const globalMute = await json("/api/mix/global-mute", {
    method: "PATCH",
    body: JSON.stringify({ globalMute: true }),
  });
  assert(globalMute.globalMute === true, "mute global não foi aplicado");

  const diagnostics = await json("/api/diagnostics");
  assert(
    diagnostics.mix.master === 64,
    "diagnóstico não reflete o master do cliente"
  );
  assert(
    diagnostics.udp.state === "listening",
    "diagnóstico não reflete UDP ativo"
  );

  const socket = createSocket("udp4");
  await waitForUdpAck(socket, udpPort);
  const afterHandshake = await json("/api/udp/status");
  assert(
    afterHandshake.packetsReceived >= 1,
    "servidor não contabilizou HELLO UDP"
  );
  assert(afterHandshake.packetsSent >= 1, "servidor não enviou ACK UDP");

  const reset = await json("/api/mix/reset", { method: "POST", body: "{}" });
  assert(reset.master === initial.master, "reset não restaurou master");
  assert(reset.globalMute === false, "reset não desativou mute global");
  assert(
    reset.channels.find(item => item.id === 1)?.muted === false,
    "reset não restaurou canal"
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        http: `${base}/api/health`,
        udp: {
          port: udpPort,
          packetsReceived: afterHandshake.packetsReceived,
          packetsSent: afterHandshake.packetsSent,
        },
        control: {
          channelLevel: 91,
          channelMuted: true,
          master: 64,
          globalMute: true,
          reset: true,
        },
      },
      null,
      2
    )
  );
}

try {
  await main();
} catch (error) {
  console.error(`[e2e] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
} finally {
  if (child?.pid) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  }
  await rm(stateDir, { recursive: true, force: true });
}

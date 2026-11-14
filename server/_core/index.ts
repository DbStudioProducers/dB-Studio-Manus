import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { join } from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { UdpAudioTransport } from "../udp";
import { MixState } from "../mix-state";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const udpAudio = new UdpAudioTransport();
  const mixState = new MixState(
    process.env.MIX_STATE_FILE || join(process.cwd(), "data", "mix-state.json")
  );
  await udpAudio.start();
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/udp/status", (_req, res) => res.json(udpAudio.getStatus()));
  app.post("/api/udp/join", (_req, res) =>
    res.json({
      ...udpAudio.getStatus(),
      joinCode: udpAudio.createJoinToken(),
      sessionToken: udpAudio.createSessionToken(),
      tokenTtlSeconds: 300,
    })
  );
  app.get("/api/mix", (_req, res) => res.json(mixState.getSnapshot()));
  app.get("/api/diagnostics", (_req, res) =>
    res.json({ udp: udpAudio.getStatus(), mix: mixState.getSnapshot() })
  );
  app.patch("/api/mix/master", (req, res) => {
    try {
      res.json(mixState.updateMaster(req.body?.master, req.body?.revision));
    } catch (error) {
      const status =
        (error as Error & { code?: string }).code === "STALE_REVISION"
          ? 409
          : 400;
      res.status(status).json({
        error: (error as Error).message,
        code: (error as Error & { code?: string }).code,
      });
    }
  });
  app.patch("/api/mix/global-mute", (req, res) => {
    try {
      res.json(
        mixState.updateGlobalMute(req.body?.globalMute, req.body?.revision)
      );
    } catch (error) {
      const status =
        (error as Error & { code?: string }).code === "STALE_REVISION"
          ? 409
          : 400;
      res.status(status).json({
        error: (error as Error).message,
        code: (error as Error & { code?: string }).code,
      });
    }
  });
  app.patch("/api/mix/channels/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) throw new Error("invalid channel id");
      res.json(mixState.updateChannel(id, req.body ?? {}, req.body?.revision));
    } catch (error) {
      const typed = error as Error & { code?: string };
      const status = typed.code === "STALE_REVISION" ? 409 : 400;
      res.status(status).json({ error: typed.message, code: typed.code });
    }
  });
  app.post("/api/mix/reset", (req, res) => {
    try {
      res.json(mixState.reset(req.body?.revision));
    } catch (error) {
      const typed = error as Error & { code?: string };
      const status = typed.code === "STALE_REVISION" ? 409 : 400;
      res.status(status).json({ error: typed.message, code: typed.code });
    }
  });
  app.get("/api/platform/config.js", (_req, res) => {
    res
      .set("Cache-Control", "no-store")
      .type("application/javascript")
      .send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid PORT");
  server.on("error", error => {
    console.error("Server failed:", error.message);
    process.exit(1);
  });
  server.listen(port, "0.0.0.0", () =>
    console.log(`Server listening on port ${port}`)
  );
}

startServer().catch(error => {
  console.error(error);
  process.exit(1);
});

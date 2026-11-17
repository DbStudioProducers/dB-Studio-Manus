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
import { LocalAuth } from "../local-auth";
import { LocalDiscovery } from "../local-discovery";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const udpAudio = new UdpAudioTransport();
  const mixState = new MixState(
    process.env.MIX_STATE_FILE || join(process.cwd(), "data", "mix-state.json")
  );
  const localAuth = new LocalAuth(
    process.env.LOCAL_AUTH_FILE || join(process.cwd(), "data", "users.json")
  );
  const port = Number(process.env.PORT || "3000");
  const localDiscovery = new LocalDiscovery(port);
  const requireAuth = (
    req: express.Request,
    res: express.Response,
    roles?: string[]
  ) => {
    const session = localAuth.authenticate(req.headers.authorization);
    if (!session) {
      res
        .status(401)
        .json({ error: "authentication required", code: "AUTH_REQUIRED" });
      return null;
    }
    if (roles && !roles.includes(session.user.role)) {
      res
        .status(403)
        .json({ error: "insufficient permissions", code: "FORBIDDEN" });
      return null;
    }
    return session;
  };
  await udpAudio.start();
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/discovery", (_req, res) => res.json(localDiscovery.getInfo()));
  app.get("/api/auth/status", (_req, res) =>
    res.json({ setupRequired: !localAuth.isSetup(), localOnly: true })
  );
  app.post("/api/auth/setup", (req, res) => {
    try {
      res.status(201).json({ user: localAuth.setupTechnician(req.body ?? {}) });
    } catch (error) {
      res
        .status(400)
        .json({ error: (error as Error).message, code: "AUTH_SETUP_FAILED" });
    }
  });
  app.post("/api/auth/login", (req, res) => {
    try {
      res.json(localAuth.login(req.body ?? {}));
    } catch (error) {
      res
        .status(401)
        .json({ error: (error as Error).message, code: "AUTH_LOGIN_FAILED" });
    }
  });
  app.get("/api/auth/me", (req, res) => {
    const session = requireAuth(req, res);
    if (session) res.json({ user: session.user });
  });
  app.post("/api/auth/logout", (req, res) => {
    localAuth.logout(req.headers.authorization);
    res.status(204).end();
  });
  app.get("/api/auth/users", (req, res) => {
    if (!requireAuth(req, res, ["technician"])) return;
    res.json({ users: localAuth.listUsers() });
  });
  app.post("/api/auth/users", (req, res) => {
    if (!requireAuth(req, res, ["technician"])) return;
    try {
      res.status(201).json({ user: localAuth.createUser(req.body ?? {}) });
    } catch (error) {
      res
        .status(400)
        .json({ error: (error as Error).message, code: "USER_CREATE_FAILED" });
    }
  });
  app.patch("/api/auth/users/:id", (req, res) => {
    if (!requireAuth(req, res, ["technician"])) return;
    try {
      res.json({ user: localAuth.updateUser(req.params.id, req.body ?? {}) });
    } catch (error) {
      res
        .status(400)
        .json({ error: (error as Error).message, code: "USER_UPDATE_FAILED" });
    }
  });
  app.get("/api/udp/status", (_req, res) => res.json(udpAudio.getStatus()));
  app.post("/api/udp/join", (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    res.json({
      ...udpAudio.getStatus(),
      user: session.user,
      joinCode: udpAudio.createJoinToken(),
      sessionToken: udpAudio.createSessionToken(),
      tokenTtlSeconds: 300,
    });
  });
  app.get("/api/mix", (_req, res) => res.json(mixState.getSnapshot()));
  app.get("/api/diagnostics", (req, res) => {
    if (!requireAuth(req, res)) return;
    res.json({ udp: udpAudio.getStatus(), mix: mixState.getSnapshot() });
  });
  app.patch("/api/mix/master", (req, res) => {
    if (!requireAuth(req, res)) return;
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
    if (!requireAuth(req, res)) return;
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
    if (!requireAuth(req, res)) return;
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
    if (!requireAuth(req, res, ["technician"])) return;
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

  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid PORT");
  server.on("error", error => {
    console.error("Server failed:", error.message);
    process.exit(1);
  });
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
    localDiscovery.start();
  });
  const shutdown = () => {
    localDiscovery.stop();
    udpAudio.stop();
    server.close();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

startServer().catch(error => {
  console.error(error);
  process.exit(1);
});

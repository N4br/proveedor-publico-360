import type { IncomingMessage, ServerResponse } from "node:http";
import { buildServer } from "../apps/api/src/server.js";

let appPromise: ReturnType<typeof buildServer> | null = null;

async function getApp() {
  appPromise ??= buildServer();
  const app = await appPromise;
  await app.ready();
  return app;
}

function normalizeUrlForFastify(req: IncomingMessage) {
  const originalUrl = req.url ?? "/api/health";
  const url = new URL(originalUrl, "http://vercel.local");
  const pathParam = url.searchParams.get("path");

  if (!pathParam) {
    if (url.pathname === "/api" || url.pathname === "/api/") {
      req.url = "/api/health";
    }
    return;
  }

  url.searchParams.delete("path");
  const cleanPath = pathParam.replace(/^\/+/, "");
  const query = url.searchParams.toString();
  req.url = `/api/${cleanPath}${query ? `?${query}` : ""}`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  normalizeUrlForFastify(req);
  const app = await getApp();
  app.server.emit("request", req, res);
}

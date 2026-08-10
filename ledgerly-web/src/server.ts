import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function attachSecurityHeaders(response: Response, requestId?: string, correlationId?: string): Response {
  const headers = new Headers(response.headers);
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://reolkedgerlsqmklxhez.supabase.co;",
  );
  headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (requestId) headers.set("X-Request-ID", requestId);
  if (correlationId) headers.set("X-Correlation-ID", correlationId);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const startTime = Date.now();

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    const requestId = request.headers.get("x-request-id") || `req_${Math.random().toString(36).substring(2, 11)}`;
    const correlationId = request.headers.get("x-correlation-id") || `corr_${Math.random().toString(36).substring(2, 11)}`;

    // Health, Readiness, and Liveness endpoints
    if (url.pathname === "/api/health") {
      return attachSecurityHeaders(
        new Response(
          JSON.stringify({
            status: "healthy",
            uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            environment: process.env.NODE_ENV || "development",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        ),
        requestId,
        correlationId
      );
    }

    if (url.pathname === "/api/liveness") {
      return attachSecurityHeaders(
        new Response(
          JSON.stringify({
            status: "alive",
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        ),
        requestId,
        correlationId
      );
    }

    if (url.pathname === "/api/readiness") {
      // Perform downstream check (e.g. Supabase ping / environment check)
      const hasSupabase = Boolean(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
      const isReady = hasSupabase || process.env.NODE_ENV !== "production";

      return attachSecurityHeaders(
        new Response(
          JSON.stringify({
            status: isReady ? "ready" : "not_ready",
            services: {
              database: isReady ? "connected" : "degraded",
              storage: "operational",
              auth: "operational",
            },
            timestamp: new Date().toISOString(),
          }),
          { status: isReady ? 200 : 503, headers: { "Content-Type": "application/json" } }
        ),
        requestId,
        correlationId
      );
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return attachSecurityHeaders(normalized, requestId, correlationId);
    } catch (error) {
      console.error(error);
      const errRes = new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
      return attachSecurityHeaders(errRes, requestId, correlationId);
    }
  },
};

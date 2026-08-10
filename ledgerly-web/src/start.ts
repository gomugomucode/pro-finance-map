import { createStart, createMiddleware, createCsrfMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("RATE_LIMIT_EXCEEDED")) {
      const retryAfter = error.message.split(":")[1] || "60";
      return new Response(
        JSON.stringify({
          error: "RATE_LIMITED",
          message: "Too many requests. Please wait a moment and try again.",
          retry_after: parseInt(retryAfter, 10),
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "Retry-After": retryAfter,
          },
        }
      );
    }

    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, errorMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));

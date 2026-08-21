import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth, applyRateLimit } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, applyRateLimit("updateProfile", 30, 60)])
  .validator((v: unknown) =>
    z
      .object({
        display_name: z.string().trim().max(60).optional(),
        base_currency: z.string().length(3).optional(),
        locale: z.string().max(20).optional(),
        date_format: z.string().optional(),
        number_format: z.string().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

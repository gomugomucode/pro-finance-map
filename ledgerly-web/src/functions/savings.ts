import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { savingsGoalInput, savingsContributionInput } from "@/lib/schemas";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type SavingsGoalRow = Database["public"]["Tables"]["savings_goals"]["Row"];
export type SavingsContributionRow = Database["public"]["Tables"]["savings_contributions"]["Row"];

export const listSavingsGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as SavingsGoalRow[];
  });

export const createSavingsGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => savingsGoalInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("savings_goals")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as SavingsGoalRow;
  });

export const updateSavingsGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: savingsGoalInput.partial() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("savings_goals")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSavingsGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("savings_goals")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addSavingsContribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => savingsContributionInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: goal } = await context.supabase
      .from("savings_goals")
      .select("id, current_minor, target_minor")
      .eq("id", data.goal_id)
      .eq("user_id", context.userId)
      .single();
    if (!goal) throw new Error("Savings goal not found.");

    const { error: contribErr } = await context.supabase
      .from("savings_contributions")
      .insert({ goal_id: data.goal_id, amount_minor: data.amount_minor, note: data.note ?? null });
    if (contribErr) throw new Error(contribErr.message);

    const newAmount = Math.max(0, Number(goal.current_minor) + data.amount_minor);
    const isCompleted = newAmount >= Number(goal.target_minor);
    const { error } = await context.supabase
      .from("savings_goals")
      .update({ current_minor: newAmount, is_completed: isCompleted })
      .eq("id", data.goal_id);
    if (error) throw new Error(error.message);
    return { ok: true, current_minor: newAmount, is_completed: isCompleted };
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { contactInput, loanInput, loanPaymentInput } from "@/lib/schemas";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
export type LoanRow = Database["public"]["Tables"]["loans"]["Row"];
export type LoanPaymentRow = Database["public"]["Tables"]["loan_payments"]["Row"];

export const listContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("contacts")
      .select("*")
      .eq("user_id", context.userId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ContactRow[];
  });

export const createContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => contactInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("contacts")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as ContactRow;
  });

export const deleteContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("contacts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listLoans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("loans")
      .select("*, contacts(name, phone, email)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => loanInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("loans")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as LoanRow;
  });

export const updateLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: loanInput.partial() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("loans")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("loans")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addLoanPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => loanPaymentInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: loan } = await context.supabase
      .from("loans")
      .select("id, principal_minor, paid_minor")
      .eq("id", data.loan_id)
      .eq("user_id", context.userId)
      .single();
    if (!loan) throw new Error("Loan not found.");

    const { error } = await context.supabase.from("loan_payments").insert({
      loan_id: data.loan_id,
      amount_minor: data.amount_minor,
      note: data.note ?? null,
      paid_at: data.paid_at ?? new Date().toISOString(),
    });
    if (error) throw new Error(error.message);

    const newPaid = Number(loan.paid_minor) + data.amount_minor;
    if (newPaid >= Number(loan.principal_minor)) {
      await context.supabase.from("loans").update({ is_settled: true }).eq("id", data.loan_id);
    }
    return { ok: true };
  });

export const listLoanPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ loan_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("loan_payments")
      .select("*")
      .eq("loan_id", data.loan_id)
      .order("paid_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as LoanPaymentRow[];
  });

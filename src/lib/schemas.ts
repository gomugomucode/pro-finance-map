import { z } from "zod";

export const accountTypes = [
  "cash",
  "bank",
  "wallet",
  "credit_card",
  "debit_card",
  "digital_wallet",
  "savings",
  "fixed_deposit",
  "investment",
  "loan",
  "business",
  "other",
] as const;

export const accountInput = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.enum(accountTypes),
  currency: z.string().length(3),
  opening_balance_minor: z.number().int().default(0),
  credit_limit_minor: z.number().int().nullable().optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(30).optional(),
  notes: z.string().max(500).optional().nullable(),
});
export type AccountInput = z.infer<typeof accountInput>;

export const categoryInput = z.object({
  name: z.string().trim().min(1).max(50),
  kind: z.enum(["income", "expense"]),
  parent_id: z.string().uuid().nullable().optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(30).optional(),
});
export type CategoryInput = z.infer<typeof categoryInput>;

export const transactionInput = z.object({
  kind: z.enum(["income", "expense", "transfer"]),
  account_id: z.string().uuid(),
  to_account_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  amount_minor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  occurred_at: z.string(), // ISO
  description: z.string().max(200).optional().nullable(),
  merchant: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().max(30)).max(20).optional(),
});
export type TransactionInput = z.infer<typeof transactionInput>;

export const listTransactionsInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  account_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  kind: z.enum(["income", "expense", "transfer"]).optional(),
  search: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(200).default(100),
});
export type ListTransactionsInput = z.infer<typeof listTransactionsInput>;

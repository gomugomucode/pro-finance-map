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
  is_frozen: z.boolean().optional().default(false),
  is_hidden: z.boolean().optional().default(false),
  is_favorite: z.boolean().optional().default(false),
  sort_order: z.number().int().optional().default(0),
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

export const merchantInput = z.object({
  name: z.string().trim().min(1).max(100),
  default_category_id: z.string().uuid().nullable().optional(),
  default_account_id: z.string().uuid().nullable().optional(),
  default_payment_method: z.string().max(50).nullable().optional(),
  icon: z.string().max(30).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  is_favorite: z.boolean().optional().default(false),
  is_archived: z.boolean().optional().default(false),
});
export type MerchantInput = z.infer<typeof merchantInput>;

export const transactionSplitInput = z.object({
  category_id: z.string().uuid().nullable().optional(),
  amount_minor: z.number().int().nonnegative(),
  note: z.string().max(200).optional().nullable(),
});
export type TransactionSplitInput = z.infer<typeof transactionSplitInput>;

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
  location: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().max(30)).max(20).optional(),
  payment_method: z.string().max(50).optional().nullable(),
  reference_number: z.string().max(100).optional().nullable(),
  is_favorite: z.boolean().optional().default(false),
  reconciled: z.boolean().optional().default(false),
  import_batch_id: z.string().uuid().optional().nullable(),
  splits: z.array(transactionSplitInput).optional(),
});
export type TransactionInput = z.infer<typeof transactionInput>;

export const importProfileInput = z.object({
  name: z.string().trim().min(1).max(60),
  date_format: z.string().default("YYYY-MM-DD"),
  delimiter: z.string().default(","),
  column_mapping: z.record(z.string()),
});
export type ImportProfileInput = z.infer<typeof importProfileInput>;

export const listTransactionsInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  account_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  kind: z.enum(["income", "expense", "transfer"]).optional(),
  search: z.string().max(100).optional(),
  payment_method: z.string().max(50).optional(),
  reference_number: z.string().max(100).optional(),
  is_favorite: z.boolean().optional(),
  is_deleted: z.boolean().optional(),
  reconciled: z.boolean().optional(),
  tag: z.string().max(30).optional(),
  min_amount: z.number().optional(),
  max_amount: z.number().optional(),
  merchant: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(1000).default(200),
});
export type ListTransactionsInput = z.infer<typeof listTransactionsInput>;

export const transactionTemplateInput = z.object({
  name: z.string().trim().min(1).max(60),
  kind: z.enum(["income", "expense", "transfer"]),
  account_id: z.string().uuid(),
  to_account_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  amount_minor: z.number().int().nonnegative().default(0),
  description: z.string().max(200).optional().nullable(),
  merchant: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().max(30)).max(20).optional(),
});
export type TransactionTemplateInput = z.infer<typeof transactionTemplateInput>;

/* ============ BUDGET SCHEMAS ============ */

export const budgetPeriodTypes = ["weekly", "monthly", "yearly", "custom"] as const;

export const budgetInput = z.object({
  name: z.string().trim().min(1).max(60),
  period_type: z.enum(budgetPeriodTypes),
  amount_minor: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  category_ids: z.array(z.string().uuid()).optional(),
  rollover: z.boolean().default(false),
  is_active: z.boolean().default(true),
  start_date: z.string(), // ISO date
  end_date: z.string().optional().nullable(),
});
export type BudgetInput = z.infer<typeof budgetInput>;

/* ============ SAVINGS SCHEMAS ============ */

export const savingsGoalPresets = [
  "emergency_fund", "vacation", "vehicle", "house", "education", "investment", "other"
] as const;

export const savingsGoalInput = z.object({
  name: z.string().trim().min(1).max(60),
  icon: z.string().max(30).default("piggy-bank"),
  color: z.string().max(20).default("#22D3A0"),
  target_minor: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  deadline: z.string().optional().nullable(),
  account_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});
export type SavingsGoalInput = z.infer<typeof savingsGoalInput>;

export const savingsContributionInput = z.object({
  goal_id: z.string().uuid(),
  amount_minor: z.number().int(), // can be negative for withdrawal
  note: z.string().max(200).optional().nullable(),
});
export type SavingsContributionInput = z.infer<typeof savingsContributionInput>;

/* ============ CONTACT SCHEMAS ============ */

export const contactInput = z.object({
  name: z.string().trim().min(1).max(60),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});
export type ContactInput = z.infer<typeof contactInput>;

/* ============ LOAN SCHEMAS ============ */

export const loanInput = z.object({
  contact_id: z.string().uuid().optional().nullable(),
  direction: z.enum(["borrowed", "lent"]),
  principal_minor: z.number().int().positive(),
  interest_rate: z.number().min(0).max(100).default(0),
  currency: z.string().length(3).default("USD"),
  due_date: z.string().optional().nullable(),
  description: z.string().max(200).optional().nullable(),
});
export type LoanInput = z.infer<typeof loanInput>;

export const loanPaymentInput = z.object({
  loan_id: z.string().uuid(),
  amount_minor: z.number().int().positive(),
  note: z.string().max(200).optional().nullable(),
  paid_at: z.string().optional(),
});
export type LoanPaymentInput = z.infer<typeof loanPaymentInput>;

/* ============ RECURRING SCHEMAS ============ */

export const recurrenceFrequencies = [
  "daily", "weekly", "biweekly", "monthly", "quarterly", "yearly", "custom"
] as const;

export const recurringTransactionInput = z.object({
  name: z.string().trim().min(1).max(60),
  kind: z.enum(["income", "expense", "transfer"]),
  account_id: z.string().uuid(),
  to_account_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  amount_minor: z.number().int().positive(),
  currency: z.string().length(3),
  frequency: z.enum(recurrenceFrequencies),
  interval_days: z.number().int().positive().optional().nullable(),
  start_date: z.string(),
  end_date: z.string().optional().nullable(),
  next_due_date: z.string(),
  is_paused: z.boolean().default(false),
  auto_create: z.boolean().default(false),
  description: z.string().max(200).optional().nullable(),
});
export type RecurringTransactionInput = z.infer<typeof recurringTransactionInput>;

/* ============ SUBSCRIPTION SCHEMAS ============ */

export const billingCycles = ["weekly", "monthly", "yearly"] as const;

export const subscriptionInput = z.object({
  name: z.string().trim().min(1).max(60),
  provider_icon: z.string().max(30).optional().nullable(),
  color: z.string().max(20).default("#22D3A0"),
  amount_minor: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  billing_cycle: z.enum(billingCycles),
  next_renewal_date: z.string(),
  account_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().default(true),
  reminder_days_before: z.number().int().min(0).max(30).default(3),
  notes: z.string().max(500).optional().nullable(),
});
export type SubscriptionInput = z.infer<typeof subscriptionInput>;

import type { Database } from "../../ledgerly-web/src/integrations/supabase/types";

export type { Database } from "../../ledgerly-web/src/integrations/supabase/types";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// Convenience Domain Aliases
export type Account = Tables<"accounts">;
export type AccountInsert = TablesInsert<"accounts">;
export type AccountUpdate = TablesUpdate<"accounts">;
export type AccountType = Enums<"account_type">;

export type Transaction = Tables<"transactions">;
export type TransactionInsert = TablesInsert<"transactions">;
export type TransactionUpdate = TablesUpdate<"transactions">;
export type TransactionKind = Enums<"transaction_kind">;

export type Profile = Tables<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export type Category = Tables<"categories">;
export type Budget = Tables<"budgets">;
export type Loan = Tables<"loans">;
export type SavingsGoal = Tables<"savings_goals">;
export type WealthAsset = Tables<"assets">;
export type WealthLiability = Tables<"liabilities">;

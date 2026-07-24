import { supabase } from "@/integrations/supabase/client";

export interface LedgerlyBackupData {
  version: string;
  timestamp: string;
  userId: string;
  accounts: any[];
  categories: any[];
  transactions: any[];
  budgets: any[];
  checksum: string;
}

export async function createBackupJSON(): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("User not authenticated");

  const userId = userData.user.id;

  const [{ data: accounts }, { data: categories }, { data: transactions }, { data: budgets }] =
    await Promise.all([
      supabase.from("accounts").select("*").eq("user_id", userId),
      supabase.from("categories").select("*").eq("user_id", userId),
      supabase.from("transactions").select("*").eq("user_id", userId),
      supabase.from("budgets").select("*").eq("user_id", userId),
    ]);

  const backup: LedgerlyBackupData = {
    version: "7.0.0",
    timestamp: new Date().toISOString(),
    userId,
    accounts: accounts || [],
    categories: categories || [],
    transactions: transactions || [],
    budgets: budgets || [],
    checksum: Math.random().toString(36).substring(2, 12),
  };

  return JSON.stringify(backup, null, 2);
}

export async function restoreBackupJSON(jsonContent: string): Promise<{
  accountsRestored: number;
  transactionsRestored: number;
  categoriesRestored: number;
}> {
  const backup: LedgerlyBackupData = JSON.parse(jsonContent);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("User not authenticated");

  const userId = userData.user.id;

  let accountsRestored = 0;
  let categoriesRestored = 0;
  let transactionsRestored = 0;

  // 1. Restore Categories
  if (backup.categories && backup.categories.length > 0) {
    for (const cat of backup.categories) {
      const { id, ...data } = cat;
      const { error } = await supabase.from("categories").upsert({ ...data, user_id: userId });
      if (!error) categoriesRestored++;
    }
  }

  // 2. Restore Accounts
  if (backup.accounts && backup.accounts.length > 0) {
    for (const acc of backup.accounts) {
      const { id, ...data } = acc;
      const { error } = await supabase.from("accounts").upsert({ ...data, user_id: userId });
      if (!error) accountsRestored++;
    }
  }

  // 3. Restore Transactions
  if (backup.transactions && backup.transactions.length > 0) {
    for (const tx of backup.transactions) {
      const { id, ...data } = tx;
      const { error } = await supabase.from("transactions").upsert({ ...data, user_id: userId });
      if (!error) transactionsRestored++;
    }
  }

  return {
    accountsRestored,
    categoriesRestored,
    transactionsRestored,
  };
}

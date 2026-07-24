import { supabase } from "@/integrations/supabase/client";

export async function seedDemoData(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("User not authenticated");

  const userId = userData.user.id;

  // 1. Create Demo Checking Account
  const { data: demoAccount } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: "[Demo] Primary Checking",
      type: "checking",
      currency: "USD",
      opening_balance_minor: 450000,
      current_balance_minor: 450000,
      color: "#2563EB",
    })
    .select()
    .single();

  if (demoAccount) {
    // 2. Insert Demo Transactions
    await supabase.from("transactions").insert([
      {
        user_id: userId,
        account_id: demoAccount.id,
        merchant_name: "Starbucks Coffee",
        amount_minor: 650,
        kind: "expense",
        currency: "USD",
        occurred_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        account_id: demoAccount.id,
        merchant_name: "Tech Corp Payroll",
        amount_minor: 320000,
        kind: "income",
        currency: "USD",
        occurred_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        account_id: demoAccount.id,
        merchant_name: "Whole Foods Market",
        amount_minor: 14250,
        kind: "expense",
        currency: "USD",
        occurred_at: new Date().toISOString(),
      },
    ]);
  }
}

export async function clearDemoData(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("User not authenticated");

  const userId = userData.user.id;

  // Delete accounts starting with [Demo]
  const { data: demoAccounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", "%[Demo]%");

  if (demoAccounts && demoAccounts.length > 0) {
    const ids = demoAccounts.map((a) => a.id);
    await supabase.from("transactions").delete().in("account_id", ids);
    await supabase.from("accounts").delete().in("id", ids);
    return ids.length;
  }

  return 0;
}

import { describe, it, expect } from "vitest";
import { convertCurrency } from "../fx-engine";

interface AccountState {
  id: string;
  name: string;
  currency: string;
  opening_balance_minor: number;
  current_balance_minor: number;
  is_frozen: boolean;
}

interface TxState {
  id: string;
  account_id: string;
  to_account_id?: string | null;
  kind: "income" | "expense" | "transfer";
  amount_minor: number;
  currency: string;
}

function computeAccountBalance(account: AccountState, txs: TxState[]): number {
  let delta = 0;
  for (const tx of txs) {
    if (tx.kind === "income" && tx.account_id === account.id) {
      delta += tx.amount_minor;
    } else if (tx.kind === "expense" && tx.account_id === account.id) {
      delta -= tx.amount_minor;
    } else if (tx.kind === "transfer") {
      if (tx.account_id === account.id) {
        // Outgoing transfer
        delta -= tx.amount_minor;
      }
      if (tx.to_account_id === account.id) {
        // Incoming transfer (with FX rate if different currency)
        const incomingAmount =
          tx.currency === account.currency
            ? tx.amount_minor
            : convertCurrency(tx.amount_minor, tx.currency, account.currency);
        delta += incomingAmount;
      }
    }
  }
  return account.opening_balance_minor + delta;
}

describe("Account Balance Calculation Engine", () => {
  it("computes standard balance from opening balance + income - expenses", () => {
    const acc: AccountState = {
      id: "acc-1",
      name: "Checking",
      currency: "USD",
      opening_balance_minor: 100000, // $1,000
      current_balance_minor: 100000,
      is_frozen: false,
    };

    const txs: TxState[] = [
      { id: "tx-1", account_id: "acc-1", kind: "income", amount_minor: 50000, currency: "USD" }, // +$500
      { id: "tx-2", account_id: "acc-1", kind: "expense", amount_minor: 20000, currency: "USD" }, // -$200
      { id: "tx-3", account_id: "acc-1", kind: "expense", amount_minor: 10000, currency: "USD" }, // -$100
    ];

    const finalBalance = computeAccountBalance(acc, txs);
    // 1000 + 500 - 200 - 100 = 1200 (120000 minor)
    expect(finalBalance).toBe(120000);
  });

  it("handles same-currency transfer between two accounts", () => {
    const accA: AccountState = {
      id: "acc-a",
      name: "Checking",
      currency: "USD",
      opening_balance_minor: 100000,
      current_balance_minor: 100000,
      is_frozen: false,
    };

    const accB: AccountState = {
      id: "acc-b",
      name: "Savings",
      currency: "USD",
      opening_balance_minor: 50000,
      current_balance_minor: 50000,
      is_frozen: false,
    };

    const transferTx: TxState = {
      id: "tx-transfer-1",
      account_id: "acc-a",
      to_account_id: "acc-b",
      kind: "transfer",
      amount_minor: 30000, // $300 transfer
      currency: "USD",
    };

    const balA = computeAccountBalance(accA, [transferTx]);
    const balB = computeAccountBalance(accB, [transferTx]);

    // accA: 1000 - 300 = $700 (70000 minor)
    // accB: 500 + 300 = $800 (80000 minor)
    expect(balA).toBe(70000);
    expect(balB).toBe(80000);
    expect(balA + balB).toBe(accA.opening_balance_minor + accB.opening_balance_minor);
  });

  it("handles cross-currency transfer (USD to EUR)", () => {
    const accUSD: AccountState = {
      id: "acc-usd",
      name: "US Bank",
      currency: "USD",
      opening_balance_minor: 100000, // $1,000
      current_balance_minor: 100000,
      is_frozen: false,
    };

    const accEUR: AccountState = {
      id: "acc-eur",
      name: "Euro Bank",
      currency: "EUR",
      opening_balance_minor: 0,
      current_balance_minor: 0,
      is_frozen: false,
    };

    // Transfer 100 USD (10000 minor) to EUR (rate 0.92 -> 92 EUR / 9200 minor)
    const crossTransfer: TxState = {
      id: "tx-cross-1",
      account_id: "acc-usd",
      to_account_id: "acc-eur",
      kind: "transfer",
      amount_minor: 10000,
      currency: "USD",
    };

    const balUSD = computeAccountBalance(accUSD, [crossTransfer]);
    const balEUR = computeAccountBalance(accEUR, [crossTransfer]);

    expect(balUSD).toBe(90000); // 1000 - 100 = 900 USD
    expect(balEUR).toBe(9200); // 0 + 92 = 92 EUR
  });
});

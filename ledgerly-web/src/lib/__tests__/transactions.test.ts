import { describe, it, expect } from "vitest";
import { transactionInput, accountInput, budgetInput, loanInput } from "../schemas";

describe("Transaction Validation Schemas", () => {
  it("validates valid expense transaction input", () => {
    const validExpense = {
      account_id: "123e4567-e89b-12d3-a456-426614174000",
      amount_minor: 4500,
      currency: "USD",
      kind: "expense",
      occurred_at: "2026-08-21T10:00:00.000Z",
      merchant: "Whole Foods",
      description: "Weekly Groceries",
    };

    const parsed = transactionInput.parse(validExpense);
    expect(parsed.amount_minor).toBe(4500);
    expect(parsed.kind).toBe("expense");
  });

  it("validates valid transfer transaction with destination account", () => {
    const validTransfer = {
      account_id: "123e4567-e89b-12d3-a456-426614174000",
      to_account_id: "223e4567-e89b-12d3-a456-426614174001",
      amount_minor: 10000,
      currency: "USD",
      kind: "transfer",
      occurred_at: "2026-08-21T12:00:00.000Z",
      description: "Monthly Savings Allocation",
    };

    const parsed = transactionInput.parse(validTransfer);
    expect(parsed.kind).toBe("transfer");
    expect(parsed.to_account_id).toBe("223e4567-e89b-12d3-a456-426614174001");
  });

  it("rejects non-positive transaction amounts", () => {
    const invalidExpense = {
      account_id: "123e4567-e89b-12d3-a456-426614174000",
      amount_minor: -500,
      currency: "USD",
      kind: "expense",
      occurred_at: "2026-08-21T10:00:00.000Z",
    };

    expect(() => transactionInput.parse(invalidExpense)).toThrow();
  });
});

describe("Account & Budget Schemas", () => {
  it("validates account creation inputs", () => {
    const validAccount = {
      name: "Chase Sapphire",
      type: "credit_card",
      currency: "USD",
      opening_balance_minor: 0,
      current_balance_minor: 0,
      credit_limit_minor: 1000000,
    };

    const parsed = accountInput.parse(validAccount);
    expect(parsed.type).toBe("credit_card");
    expect(parsed.name).toBe("Chase Sapphire");
  });

  it("validates budget configuration", () => {
    const validBudget = {
      name: "Dining Out",
      amount_minor: 50000,
      period_type: "monthly",
      start_date: "2026-08-01",
      rollover: false,
    };

    const parsed = budgetInput.parse(validBudget);
    expect(parsed.amount_minor).toBe(50000);
    expect(parsed.period_type).toBe("monthly");
  });
});

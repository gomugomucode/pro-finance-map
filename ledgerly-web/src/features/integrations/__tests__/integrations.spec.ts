import { describe, it, expect } from "vitest";
import { parseStripeWebhookEvent } from "../providers/stripe";
import { parsePayPalWebhookEvent } from "../providers/paypal";
import { UniversalWebhookHandler } from "../webhookHandler";
import { ReconciliationEngine } from "../reconciliationEngine";

describe("Stripe and PayPal Webhook Ingestion", () => {
  it("parses Stripe payment_intent.succeeded event", () => {
    const mockStripeEvent = {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_1234567890",
          amount: 5000, // $50.00
          currency: "usd",
          status: "succeeded",
          created: 1784800000,
          description: "Monthly Pro Subscription",
          charges: {
            data: [
              {
                id: "ch_123",
                balance_transaction: {
                  fee: 175, // $1.75 fee
                  net: 4825,
                },
              },
            ],
          },
        },
      },
    };

    const parsed = parseStripeWebhookEvent(mockStripeEvent);
    expect(parsed).not.toBeNull();
    expect(parsed?.amountMinor).toBe(5000);
    expect(parsed?.feeMinor).toBe(175);
    expect(parsed?.netMinor).toBe(4825);
    expect(parsed?.currency).toBe("USD");
    expect(parsed?.provider).toBe("stripe");
  });

  it("parses PayPal payment capture event", () => {
    const mockPayPalEvent = {
      id: "WH-12345",
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      create_time: "2026-08-21T10:00:00.000Z",
      resource: {
        id: "CAPTURE-999",
        amount: {
          total: "120.00",
          currency: "USD",
          details: {
            fee: "4.10",
          },
        },
        description: "Consulting Services Invoice #102",
      },
    };

    const parsed = parsePayPalWebhookEvent(mockPayPalEvent);
    expect(parsed).not.toBeNull();
    expect(parsed?.amountMinor).toBe(12000);
    expect(parsed?.feeMinor).toBe(410);
    expect(parsed?.netMinor).toBe(11590);
    expect(parsed?.provider).toBe("paypal");
  });

  it("handles idempotent webhook processing (ignores duplicates)", () => {
    const handler = new UniversalWebhookHandler();
    const event = {
      id: "evt_dup_123",
      provider: "stripe" as const,
      eventType: "payment_intent.succeeded",
      payload: {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_dup",
            amount: 2500,
            currency: "usd",
            status: "succeeded",
            created: 1784800000,
          },
        },
      },
      receivedAt: new Date().toISOString(),
    };

    const firstRun = handler.processWebhook(event);
    expect(firstRun.success).toBe(true);
    expect(firstRun.duplicate).toBe(false);

    const secondRun = handler.processWebhook(event);
    expect(secondRun.success).toBe(true);
    expect(secondRun.duplicate).toBe(true);
    expect(secondRun.transaction).toBeNull();
  });
});

describe("Automated Reconciliation Engine", () => {
  it("reconciles exact matching gross transactions", () => {
    const engine = new ReconciliationEngine();
    const externalTxs = [
      {
        id: "stripe-pi_1",
        provider: "stripe" as const,
        externalTransactionId: "pi_1",
        amountMinor: 5000,
        currency: "USD",
        feeMinor: 175,
        netMinor: 4825,
        status: "matched" as const,
        occurredAt: "2026-08-21T12:00:00.000Z",
      },
    ];

    const internalCandidates = [
      {
        id: "tx-internal-1",
        amount_minor: 5000,
        currency: "USD",
        occurred_at: "2026-08-21T12:05:00.000Z",
      },
    ];

    const matches = engine.reconcileBatch(externalTxs, internalCandidates);
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe("exact_amount_and_date");
    expect(matches[0].confidenceScore).toBe(98);
    expect(matches[0].matchedLedgerTransaction?.id).toBe("tx-internal-1");
  });

  it("reconciles fee-adjusted net transactions", () => {
    const engine = new ReconciliationEngine();
    const externalTxs = [
      {
        id: "paypal-cap_1",
        provider: "paypal" as const,
        externalTransactionId: "cap_1",
        amountMinor: 10000, // $100 gross
        currency: "USD",
        feeMinor: 350, // $3.50 fee
        netMinor: 9650, // $96.50 deposited in bank
        status: "matched" as const,
        occurredAt: "2026-08-21T10:00:00.000Z",
      },
    ];

    const bankDeposits = [
      {
        id: "bank-dep-1",
        amount_minor: 9650, // Recorded net in bank ledger
        currency: "USD",
        occurred_at: "2026-08-21T10:30:00.000Z",
      },
    ];

    const matches = engine.reconcileBatch(externalTxs, bankDeposits);
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe("fee_adjusted");
    expect(matches[0].discrepancyMinor).toBe(350);
  });
});

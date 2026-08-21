import { ReconciledTransaction, WebhookEventPayload } from "../types";

export interface StripePaymentIntent {
  id: string;
  amount: number; // minor units (cents)
  currency: string;
  status: string;
  created: number; // unix timestamp seconds
  description?: string;
  receipt_email?: string;
  metadata?: Record<string, string>;
  charges?: {
    data: Array<{
      id: string;
      balance_transaction?: {
        fee: number;
        net: number;
      };
    }>;
  };
}

export function parseStripeWebhookEvent(
  rawEvent: Record<string, unknown>,
): ReconciledTransaction | null {
  const type = rawEvent.type as string;
  const dataObject = (rawEvent.data as { object?: StripePaymentIntent })?.object;
  if (!dataObject) return null;

  if (type === "payment_intent.succeeded" || type === "charge.succeeded") {
    const feeMinor = dataObject.charges?.data?.[0]?.balance_transaction?.fee ?? 0;
    const netMinor = dataObject.amount - feeMinor;

    return {
      id: `stripe-${dataObject.id}`,
      provider: "stripe",
      externalTransactionId: dataObject.id,
      amountMinor: dataObject.amount,
      currency: dataObject.currency.toUpperCase(),
      feeMinor,
      netMinor,
      status: "matched",
      occurredAt: new Date(dataObject.created * 1000).toISOString(),
      merchant: "Stripe Processing",
      description: dataObject.description || `Stripe Charge ${dataObject.id}`,
    };
  }

  if (type === "charge.refunded") {
    return {
      id: `stripe-refund-${dataObject.id}`,
      provider: "stripe",
      externalTransactionId: dataObject.id,
      amountMinor: -dataObject.amount,
      currency: dataObject.currency.toUpperCase(),
      feeMinor: 0,
      netMinor: -dataObject.amount,
      status: "matched",
      occurredAt: new Date(dataObject.created * 1000).toISOString(),
      merchant: "Stripe Refund",
      description: `Stripe Refund for Charge ${dataObject.id}`,
    };
  }

  return null;
}

import { ReconciledTransaction } from "../types";

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  create_time: string;
  resource?: {
    id: string;
    amount?: {
      total: string;
      currency: string;
      details?: {
        fee?: string;
      };
    };
    transaction_fee?: {
      value: string;
      currency: string;
    };
    custom?: string;
    description?: string;
  };
}

export function parsePayPalWebhookEvent(
  rawEvent: PayPalWebhookEvent,
): ReconciledTransaction | null {
  const resource = rawEvent.resource;
  if (!resource || !resource.amount) return null;

  const totalMajor = parseFloat(resource.amount.total || "0");
  const amountMinor = Math.round(totalMajor * 100);

  const feeValue = resource.transaction_fee?.value || resource.amount.details?.fee || "0";
  const feeMinor = Math.round(parseFloat(feeValue) * 100);
  const netMinor = amountMinor - feeMinor;

  if (
    rawEvent.event_type === "PAYMENT.CAPTURE.COMPLETED" ||
    rawEvent.event_type === "PAYMENT.SALE.COMPLETED"
  ) {
    return {
      id: `paypal-${resource.id}`,
      provider: "paypal",
      externalTransactionId: resource.id,
      amountMinor,
      currency: resource.amount.currency.toUpperCase(),
      feeMinor,
      netMinor,
      status: "matched",
      occurredAt: rawEvent.create_time,
      merchant: "PayPal Checkout",
      description: resource.description || `PayPal Payment ${resource.id}`,
    };
  }

  if (rawEvent.event_type === "PAYMENT.CAPTURE.REFUNDED") {
    return {
      id: `paypal-refund-${resource.id}`,
      provider: "paypal",
      externalTransactionId: resource.id,
      amountMinor: -amountMinor,
      currency: resource.amount.currency.toUpperCase(),
      feeMinor: 0,
      netMinor: -amountMinor,
      status: "matched",
      occurredAt: rawEvent.create_time,
      merchant: "PayPal Refund",
      description: `PayPal Refund for Payment ${resource.id}`,
    };
  }

  return null;
}

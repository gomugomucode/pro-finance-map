export type PaymentProvider = "stripe" | "paypal" | "plaid" | "teller" | "manual";

export type WebhookStatus = "pending" | "processed" | "failed" | "ignored";

export interface WebhookEventPayload {
  id: string;
  provider: PaymentProvider;
  eventType: string;
  payload: Record<string, unknown>;
  signature?: string;
  receivedAt: string;
}

export interface ReconciledTransaction {
  id: string;
  provider: PaymentProvider;
  externalTransactionId: string;
  amountMinor: number;
  currency: string;
  feeMinor: number;
  netMinor: number;
  status: "matched" | "unmatched" | "flagged" | "adjusted";
  matchedTransactionId?: string;
  discrepancyMinor?: number;
  occurredAt: string;
  merchant?: string;
  description?: string;
}

export interface ProviderConnectionConfig {
  id: string;
  provider: PaymentProvider;
  name: string;
  accountId: string;
  isActive: boolean;
  autoReconcile: boolean;
  webhookSecret?: string;
  lastSyncedAt?: string;
}

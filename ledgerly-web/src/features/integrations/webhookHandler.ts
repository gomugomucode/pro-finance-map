import { WebhookEventPayload, ReconciledTransaction } from "./types";
import { parseStripeWebhookEvent } from "./providers/stripe";
import { parsePayPalWebhookEvent, PayPalWebhookEvent } from "./providers/paypal";

export class UniversalWebhookHandler {
  private processedEventIds = new Set<string>();

  public processWebhook(event: WebhookEventPayload): {
    success: boolean;
    duplicate: boolean;
    transaction: ReconciledTransaction | null;
    error?: string;
  } {
    if (this.processedEventIds.has(event.id)) {
      return {
        success: true,
        duplicate: true,
        transaction: null,
      };
    }

    let parsedTx: ReconciledTransaction | null = null;

    try {
      if (event.provider === "stripe") {
        parsedTx = parseStripeWebhookEvent(event.payload);
      } else if (event.provider === "paypal") {
        parsedTx = parsePayPalWebhookEvent(event.payload as unknown as PayPalWebhookEvent);
      } else {
        return {
          success: false,
          duplicate: false,
          transaction: null,
          error: `Unsupported provider: ${event.provider}`,
        };
      }

      this.processedEventIds.add(event.id);

      return {
        success: true,
        duplicate: false,
        transaction: parsedTx,
      };
    } catch (err) {
      return {
        success: false,
        duplicate: false,
        transaction: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export const webhookHandler = new UniversalWebhookHandler();

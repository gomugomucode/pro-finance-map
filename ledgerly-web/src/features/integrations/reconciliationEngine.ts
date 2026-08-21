import { ReconciledTransaction, PaymentProvider } from "./types";
import { parseStripeWebhookEvent } from "./providers/stripe";
import { parsePayPalWebhookEvent, PayPalWebhookEvent } from "./providers/paypal";

export interface LedgerTransactionCandidate {
  id: string;
  amount_minor: number;
  currency: string;
  occurred_at: string;
  merchant?: string | null;
  reconciled?: boolean;
}

export interface MatchResult {
  externalTransaction: ReconciledTransaction;
  matchedLedgerTransaction?: LedgerTransactionCandidate;
  confidenceScore: number;
  matchType: "exact_amount_and_date" | "exact_amount_fuzzy_date" | "fee_adjusted" | "unmatched";
  discrepancyMinor: number;
}

export class ReconciliationEngine {
  /**
   * Reconciles external gateway transactions with the user's internal ledger transactions.
   */
  public reconcileBatch(
    externalTransactions: ReconciledTransaction[],
    ledgerCandidates: LedgerTransactionCandidate[],
    timeToleranceMinutes: number = 1440, // 24 hours
  ): MatchResult[] {
    const results: MatchResult[] = [];
    const usedLedgerIds = new Set<string>();

    for (const ext of externalTransactions) {
      const extTime = new Date(ext.occurredAt).getTime();

      // 1. Try Exact Match on gross amount and currency within time tolerance
      const exactMatch = ledgerCandidates.find((cand) => {
        if (usedLedgerIds.has(cand.id)) return false;
        if (cand.currency !== ext.currency) return false;
        if (cand.amount_minor !== Math.abs(ext.amountMinor)) return false;

        const candTime = new Date(cand.occurred_at).getTime();
        const diffMinutes = Math.abs(extTime - candTime) / (1000 * 60);
        return diffMinutes <= timeToleranceMinutes;
      });

      if (exactMatch) {
        usedLedgerIds.add(exactMatch.id);
        results.push({
          externalTransaction: { ...ext, status: "matched", matchedTransactionId: exactMatch.id },
          matchedLedgerTransaction: exactMatch,
          confidenceScore: 98,
          matchType: "exact_amount_and_date",
          discrepancyMinor: 0,
        });
        continue;
      }

      // 2. Try Net Match (where ledger transaction recorded the net after gateway fee)
      if (ext.feeMinor > 0) {
        const netMatch = ledgerCandidates.find((cand) => {
          if (usedLedgerIds.has(cand.id)) return false;
          if (cand.currency !== ext.currency) return false;
          if (cand.amount_minor !== Math.abs(ext.netMinor)) return false;

          const candTime = new Date(cand.occurred_at).getTime();
          const diffMinutes = Math.abs(extTime - candTime) / (1000 * 60);
          return diffMinutes <= timeToleranceMinutes;
        });

        if (netMatch) {
          usedLedgerIds.add(netMatch.id);
          results.push({
            externalTransaction: { ...ext, status: "matched", matchedTransactionId: netMatch.id },
            matchedLedgerTransaction: netMatch,
            confidenceScore: 90,
            matchType: "fee_adjusted",
            discrepancyMinor: ext.feeMinor,
          });
          continue;
        }
      }

      // 3. Unmatched external transaction
      results.push({
        externalTransaction: { ...ext, status: "unmatched" },
        confidenceScore: 0,
        matchType: "unmatched",
        discrepancyMinor: ext.amountMinor,
      });
    }

    return results;
  }
}

export const reconciliationEngine = new ReconciliationEngine();

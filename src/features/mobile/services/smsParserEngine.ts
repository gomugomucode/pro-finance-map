import { RawSmsMessage, ParsedSmsResult, TransactionType, SmsProviderRule } from '@/types/sms';
import { SmsProviderRuleEngine } from './smsProviderRules';
import { toMinor } from '@/lib/money';

export class SmsParserEngine {
  private ruleEngine: SmsProviderRuleEngine;
  private recentHashes = new Set<string>();

  constructor(customRules: SmsProviderRule[] = []) {
    this.ruleEngine = new SmsProviderRuleEngine(customRules);
  }

  /**
   * Parse a raw SMS message into structured financial data
   */
  parseSms(sms: RawSmsMessage): ParsedSmsResult {
    const { sender, body, timestamp } = sms;

    // 1. Calculate deduplication hash
    const messageHash = this.createMessageHash(sender, body, timestamp);
    const isDuplicate = this.recentHashes.has(messageHash);
    this.recentHashes.add(messageHash);

    // 2. Attempt Rule-based Regex Matching first
    const matched = this.ruleEngine.matchRule(sender, body);

    if (matched) {
      const { rule, match } = matched;

      const amountStr = match.groups?.amount || match[1];
      const merchantStr = match.groups?.merchant || match[2] || null;
      const refStr = match.groups?.ref || match[3] || null;
      const typeStr = match.groups?.type || match[4] || null;
      const balanceStr = match.groups?.balance || match[5] || null;

      const amountVal = amountStr ? parseFloat(amountStr) : null;
      const amountMinor = amountVal !== null ? toMinor(amountVal) : null;
      const balanceVal = balanceStr ? parseFloat(balanceStr) : null;
      const balanceMinor = balanceVal !== null ? toMinor(balanceVal) : null;

      const transactionType: TransactionType =
        typeStr && typeStr.toLowerCase().includes('credit') ? 'income' : 'expense';

      const confidence = amountVal && merchantStr ? 95 : amountVal ? 80 : 60;

      return {
        raw_message: body,
        sender,
        amount: amountVal,
        amount_minor: amountMinor,
        merchant: merchantStr ? cleanMerchantName(merchantStr) : null,
        reference_number: refStr ? refStr.trim() : null,
        transaction_type: transactionType,
        balance_minor: balanceMinor,
        occurred_at: typeof timestamp === 'number' ? new Date(timestamp).toISOString() : timestamp,
        confidence_score: confidence,
        matched_rule_id: rule.id,
        provider_name: rule.provider_name,
        unknown_fields: {},
        is_duplicate: isDuplicate,
      };
    }

    // 3. Fallback Heuristic Parsing for unconfigured bank/SMS senders
    return this.fallbackHeuristicParse(sender, body, timestamp, isDuplicate);
  }

  private fallbackHeuristicParse(
    sender: string,
    body: string,
    timestamp: string | number,
    isDuplicate: boolean
  ): ParsedSmsResult {
    const amountMatch = body.match(/(?:\$|USD|Rs|INR)\s*(\d+(?:\.\d{2})?)/i) || body.match(/(\d+\.\d{2})/);
    const amountVal = amountMatch ? parseFloat(amountMatch[1]) : null;
    const amountMinor = amountVal !== null ? toMinor(amountVal) : null;

    const lowerBody = body.toLowerCase();
    let transactionType: TransactionType = 'expense';
    if (lowerBody.includes('credited') || lowerBody.includes('received') || lowerBody.includes('deposited')) {
      transactionType = 'income';
    }

    let merchant: string | null = null;
    const merchantMatch = body.match(/(?:at|to|vpa|info)\s+([A-Z0-9\s._-]{3,25})/i);
    if (merchantMatch) {
      merchant = cleanMerchantName(merchantMatch[1]);
    }

    const refMatch = body.match(/(?:ref|txn|id)[:\s]*([a-z0-9]+)/i);
    const refStr = refMatch ? refMatch[1] : null;

    const confidence = amountVal && merchant ? 75 : amountVal ? 55 : 30;

    return {
      raw_message: body,
      sender,
      amount: amountVal,
      amount_minor: amountMinor,
      merchant,
      reference_number: refStr,
      transaction_type: transactionType,
      balance_minor: null,
      occurred_at: typeof timestamp === 'number' ? new Date(timestamp).toISOString() : timestamp,
      confidence_score: confidence,
      provider_name: 'Heuristic Fallback Engine',
      unknown_fields: {},
      is_duplicate: isDuplicate,
    };
  }

  private createMessageHash(sender: string, body: string, timestamp: string | number): string {
    const raw = `${sender.toLowerCase().trim()}_${body.trim()}_${timestamp}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `hash-${hash}`;
  }
}

function cleanMerchantName(rawName: string): string {
  return rawName
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[.*,;:]+$/, '')
    .split(' ')[0]
    ? rawName.trim().replace(/\s+/g, ' ')
    : 'Unknown Merchant';
}

export const defaultSmsParserEngine = new SmsParserEngine();

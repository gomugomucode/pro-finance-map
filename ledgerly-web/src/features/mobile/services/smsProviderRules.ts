import { SmsProviderRule } from '@/types/sms';

/**
 * Pre-seeded Configurable Provider Rules
 * These rules use named capture groups or standard regex groups to parse financial SMS without hardcoding provider logic.
 */
export const DEFAULT_PROVIDER_RULES: SmsProviderRule[] = [
  {
    id: 'rule-chase-01',
    provider_name: 'Chase Bank',
    sender_pattern: 'CHASE',
    body_regex: '(?i)spent\\s+\\$(?<amount>\\d+(?:\\.\\d{2})?)\\s+at\\s+(?<merchant>[^.]+)(?:\\.\\s+Ref:\\s*(?<ref>\\w+))?',
    amount_group: 'amount',
    merchant_group: 'merchant',
    ref_group: 'ref',
    type_group: null,
    balance_group: null,
    is_active: true,
  },
  {
    id: 'rule-amex-01',
    provider_name: 'American Express',
    sender_pattern: 'AMEX',
    body_regex: '(?i)charge\\s+of\\s+USD\\s+(?<amount>\\d+(?:\\.\\d{2})?)\\s+at\\s+(?<merchant>[^.]+)\\s+approved',
    amount_group: 'amount',
    merchant_group: 'merchant',
    ref_group: null,
    type_group: null,
    balance_group: null,
    is_active: true,
  },
  {
    id: 'rule-bofa-01',
    provider_name: 'Bank of America',
    sender_pattern: 'BOFA',
    body_regex: '(?i)card\\s+ending\\s+\\d{4}\\s+(?<type>debited|credited)\\s+\\$(?<amount>\\d+(?:\\.\\d{2})?)\\s+at\\s+(?<merchant>[^,]+)',
    amount_group: 'amount',
    merchant_group: 'merchant',
    ref_group: null,
    type_group: 'type',
    balance_group: null,
    is_active: true,
  },
  {
    id: 'rule-hdfc-01',
    provider_name: 'HDFC Bank',
    sender_pattern: 'HDFCBK',
    body_regex: '(?i)(?<type>debited|credited)\\s+by\\s+(?:Rs|INR)?\\.?\\s*(?<amount>\\d+(?:\\.\\d{2})?)\\s+at\\s+(?<merchant>[^.]+)(?:\\.\\s*Avl\\s+bal\\s*(?:Rs|INR)?\\.?\\s*(?<balance>\\d+(?:\\.\\d{2})?))?',
    amount_group: 'amount',
    merchant_group: 'merchant',
    ref_group: null,
    type_group: 'type',
    balance_group: 'balance',
    is_active: true,
  },
  {
    id: 'rule-generic-wallet',
    provider_name: 'Digital Wallet / Mobile Pay',
    sender_pattern: '*',
    body_regex: '(?i)(?:sent|paid|debited|spent)\\s+\\$?(?<amount>\\d+(?:\\.\\d{2})?)\\s+to\\s+(?<merchant>[^.]+)',
    amount_group: 'amount',
    merchant_group: 'merchant',
    ref_group: null,
    type_group: null,
    balance_group: null,
    is_active: true,
  },
];

export class SmsProviderRuleEngine {
  private rules: SmsProviderRule[] = [...DEFAULT_PROVIDER_RULES];

  constructor(customRules: SmsProviderRule[] = []) {
    if (customRules.length > 0) {
      this.rules = [...customRules, ...DEFAULT_PROVIDER_RULES];
    }
  }

  /**
   * Find matching provider rule for given sender and body
   */
  matchRule(sender: string, body: string): { rule: SmsProviderRule; match: RegExpExecArray } | null {
    const cleanSender = sender.toUpperCase().trim();

    for (const rule of this.rules) {
      if (!rule.is_active) continue;

      // Check sender pattern match (* matches any)
      const senderMatch =
        rule.sender_pattern === '*' ||
        cleanSender.includes(rule.sender_pattern.toUpperCase()) ||
        rule.sender_pattern.toUpperCase().includes(cleanSender);

      if (!senderMatch) continue;

      try {
        let regexPattern = rule.body_regex;
        let flags = 'i';
        if (regexPattern.startsWith('(?i)')) {
          regexPattern = regexPattern.substring(4);
        }

        const regex = new RegExp(regexPattern, flags);
        const execMatch = regex.exec(body);

        if (execMatch) {
          return { rule, match: execMatch };
        }
      } catch (err) {
        console.warn(`Invalid regex pattern in rule ${rule.provider_name}:`, err);
      }
    }

    return null;
  }
}

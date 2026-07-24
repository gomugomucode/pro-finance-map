export type TransactionType = 'expense' | 'income' | 'transfer';
export type ReviewStatus = 'pending' | 'approved' | 'dismissed';

export interface RawSmsMessage {
  id?: string;
  sender: string;
  body: string;
  timestamp: string | number;
}

export interface SmsProviderRule {
  id: string;
  user_id?: string | null;
  provider_name: string;
  sender_pattern: string; // e.g. "CHASE", "AMEX", "HDFCBK", "*"
  body_regex: string;
  amount_group?: string | null;
  merchant_group?: string | null;
  ref_group?: string | null;
  type_group?: string | null;
  balance_group?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ParsedSmsResult {
  raw_message: string;
  sender: string;
  amount_minor: number | null; // Integer cents/minor units
  amount: number | null; // Major units (e.g. 45.99)
  merchant: string | null;
  reference_number: string | null;
  transaction_type: TransactionType;
  balance_minor: number | null;
  occurred_at: string;
  confidence_score: number; // 0 - 100
  matched_rule_id?: string;
  provider_name?: string;
  unknown_fields: Record<string, string>;
  is_duplicate?: boolean;
}

export interface PendingImportedTransaction {
  id: string;
  user_id: string;
  source: 'sms' | 'email' | 'file';
  sender: string;
  raw_message: string;
  extracted_amount_minor: number;
  extracted_merchant: string | null;
  extracted_ref: string | null;
  extracted_type: TransactionType;
  extracted_balance_minor: number | null;
  extracted_date: string;
  confidence_score: number;
  status: ReviewStatus;
  matched_account_id: string | null;
  matched_category_id: string | null;
  matched_merchant_id: string | null;
  created_at: string;
  reviewed_at: string | null;

  // Joined presentation helpers
  account_name?: string;
  category_name?: string;
  merchant_name?: string;
}

export interface SmsImportSettings {
  user_id: string;
  sms_import_enabled: boolean;
  auto_notify: boolean;
  min_confidence_threshold: number;
  ignored_senders: string[];
  monitored_accounts: string[];
}

export interface SyncQueueItem {
  id: string;
  action: 'create_transaction' | 'approve_pending' | 'dismiss_pending';
  payload: any;
  created_at: number;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
  error_msg?: string;
}

export interface PermissionStatusState {
  smsGranted: boolean;
  notificationGranted: boolean;
  storageGranted: boolean;
}

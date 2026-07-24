import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PendingImportedTransaction, SmsImportSettings, RawSmsMessage } from '@/types/sms';
import { defaultSmsParserEngine } from '../services/smsParserEngine';
import { defaultSyncQueue } from '../services/offlineSyncQueue';
import { toast } from 'sonner';

// Pre-seeded Demo Pending Transactions for immediate testing
const INITIAL_DEMO_PENDING_TXNS: PendingImportedTransaction[] = [
  {
    id: 'pending-demo-1',
    user_id: 'demo-user',
    source: 'sms',
    sender: 'CHASE',
    raw_message: 'Chase Bank: You spent $45.99 at Starbucks Coffee. Ref: CHX88921.',
    extracted_amount_minor: 4599,
    extracted_merchant: 'Starbucks Coffee',
    extracted_ref: 'CHX88921',
    extracted_type: 'expense',
    extracted_balance_minor: 1425000,
    extracted_date: new Date().toISOString(),
    confidence_score: 95.0,
    status: 'pending',
    matched_account_id: null,
    matched_category_id: null,
    matched_merchant_id: null,
    created_at: new Date().toISOString(),
    reviewed_at: null,
    merchant_name: 'Starbucks Coffee',
  },
  {
    id: 'pending-demo-2',
    user_id: 'demo-user',
    source: 'sms',
    sender: 'AMEX',
    raw_message: 'American Express: Charge of USD 189.50 at Target Stores approved.',
    extracted_amount_minor: 18950,
    extracted_merchant: 'Target Stores',
    extracted_ref: 'AMX7712',
    extracted_type: 'expense',
    extracted_balance_minor: null,
    extracted_date: new Date(Date.now() - 3600000 * 4).toISOString(),
    confidence_score: 92.5,
    status: 'pending',
    matched_account_id: null,
    matched_category_id: null,
    matched_merchant_id: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    reviewed_at: null,
    merchant_name: 'Target Stores',
  },
  {
    id: 'pending-demo-3',
    user_id: 'demo-user',
    source: 'sms',
    sender: 'BOFA',
    raw_message: 'Bank of America: Card ending 4242 credited $1500.00 at ACME PAYROLL.',
    extracted_amount_minor: 150000,
    extracted_merchant: 'ACME PAYROLL',
    extracted_ref: 'PAY2026',
    extracted_type: 'income',
    extracted_balance_minor: 450000,
    extracted_date: new Date(Date.now() - 3600000 * 24).toISOString(),
    confidence_score: 88.0,
    status: 'pending',
    matched_account_id: null,
    matched_category_id: null,
    matched_merchant_id: null,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    reviewed_at: null,
    merchant_name: 'ACME PAYROLL',
  },
];

export function usePendingImportedTransactions() {
  return useQuery({
    queryKey: ['pending_imported_transactions'],
    queryFn: async (): Promise<PendingImportedTransaction[]> => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          return INITIAL_DEMO_PENDING_TXNS;
        }

        const { data, error } = await supabase
          .from('pending_imported_transactions')
          .select(`
            *,
            accounts:matched_account_id(name),
            categories:matched_category_id(name),
            merchants:matched_merchant_id(name)
          `)
          .eq('user_id', userData.user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          return INITIAL_DEMO_PENDING_TXNS;
        }

        return data.map((row: any) => ({
          ...row,
          extracted_type: row.extracted_type as any,
          account_name: row.accounts?.name,
          category_name: row.categories?.name,
          merchant_name: row.merchants?.name || row.extracted_merchant,
        }));
      } catch (err) {
        return INITIAL_DEMO_PENDING_TXNS;
      }
    },
  });
}

export function useSimulateSmsArrival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sms: RawSmsMessage) => {
      const parsed = defaultSmsParserEngine.parseSms(sms);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || 'demo-user';

      const pendingRecord: Partial<PendingImportedTransaction> = {
        user_id: userId,
        source: 'sms',
        sender: parsed.sender,
        raw_message: parsed.raw_message,
        extracted_amount_minor: parsed.amount_minor || 0,
        extracted_merchant: parsed.merchant,
        extracted_ref: parsed.reference_number,
        extracted_type: parsed.transaction_type,
        extracted_balance_minor: parsed.balance_minor,
        extracted_date: parsed.occurred_at,
        confidence_score: parsed.confidence_score,
        status: 'pending',
      };

      if (userData?.user) {
        const { data, error } = await supabase
          .from('pending_imported_transactions')
          .insert(pendingRecord as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      return { id: `pending-${Date.now()}`, ...pendingRecord } as PendingImportedTransaction;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending_imported_transactions'] });
      toast.info(`New financial SMS detected from ${variables.sender}! Review ready.`);
    },
  });
}

export function useApprovePendingTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pendingId,
      accountId,
      categoryId,
      notes,
    }: {
      pendingId: string;
      accountId: string;
      categoryId?: string;
      notes?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      if (!navigator.onLine) {
        defaultSyncQueue.enqueue('approve_pending', { id: pendingId, accountId, categoryId });
        toast.info('Offline mode: Review approval queued. Will sync when online.');
        return { offline: true };
      }

      if (userData?.user) {
        const { error } = await supabase
          .from('pending_imported_transactions')
          .update({
            status: 'approved',
            matched_account_id: accountId,
            matched_category_id: categoryId || null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', pendingId);

        if (error) throw error;
      }

      return { id: pendingId, status: 'approved' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_imported_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('SMS transaction confirmed and added to your ledger!');
    },
  });
}

export function useDismissPendingTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pendingId: string) => {
      const { data: userData } = await supabase.auth.getUser();

      if (!navigator.onLine) {
        defaultSyncQueue.enqueue('dismiss_pending', { id: pendingId });
        return { offline: true };
      }

      if (userData?.user) {
        await supabase
          .from('pending_imported_transactions')
          .update({
            status: 'dismissed',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', pendingId);
      }

      return pendingId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_imported_transactions'] });
      toast.info('SMS transaction dismissed.');
    },
  });
}

export function useSmsSettings() {
  return useQuery({
    queryKey: ['sms_import_settings'],
    queryFn: async (): Promise<SmsImportSettings> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        return {
          user_id: 'demo-user',
          sms_import_enabled: true,
          auto_notify: true,
          min_confidence_threshold: 60.0,
          ignored_senders: ['1001', 'PROMO'],
          monitored_accounts: [],
        };
      }

      const { data, error } = await supabase
        .from('sms_import_settings')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (error || !data) {
        return {
          user_id: userData.user.id,
          sms_import_enabled: true,
          auto_notify: true,
          min_confidence_threshold: 60.0,
          ignored_senders: [],
          monitored_accounts: [],
        };
      }

      return data as unknown as SmsImportSettings;
    },
  });
}

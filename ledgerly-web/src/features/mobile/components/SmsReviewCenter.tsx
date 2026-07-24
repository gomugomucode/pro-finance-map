import React, { useState } from 'react';
import {
  usePendingImportedTransactions,
  useApprovePendingTransaction,
  useDismissPendingTransaction,
  useSimulateSmsArrival,
} from '../hooks/useSmsImport';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Sparkles,
  Store,
  DollarSign,
  Calendar,
  Send,
  Smartphone,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '@/lib/money';

export const SmsReviewCenter: React.FC = () => {
  const { data: pendingTxns = [], isLoading } = usePendingImportedTransactions();
  const approveMutation = useApprovePendingTransaction();
  const dismissMutation = useDismissPendingTransaction();
  const simulateMutation = useSimulateSmsArrival();

  // Test SMS Simulator State
  const [simSender, setSimSender] = useState('CHASE');
  const [simMessage, setSimMessage] = useState(
    'Chase Bank: You spent $84.50 at Whole Foods Market. Ref: WFM9012.'
  );

  // Selected Category / Account per pending item
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({});

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    simulateMutation.mutate({
      sender: simSender.trim() || 'BANK',
      body: simMessage.trim(),
      timestamp: Date.now(),
    });
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate({
      pendingId: id,
      accountId: selectedAccounts[id] || 'default-account-id',
      categoryId: selectedCategories[id],
    });
  };

  const handleDismiss = (id: string) => {
    dismissMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            SMS Transaction Capture & Review Pipeline
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Android SMS auto-capture buffer. Transactions are held here for your review before being saved to your ledger.
          </p>
        </div>

        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold self-start sm:self-auto">
          {pendingTxns.length} Pending Review
        </Badge>
      </div>

      {/* Pending SMS Transactions List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Loading SMS review buffer...</div>
      ) : pendingTxns.length === 0 ? (
        <Card className="border-2 border-dashed border-border p-8 text-center bg-card space-y-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">All caught up!</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              No unreviewed SMS transactions. Test our SMS parser below to simulate incoming bank messages.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingTxns.map((item) => (
            <Card key={item.id} className="border-border bg-card shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 space-y-4">
                {/* Item Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{item.sender}</span>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {new Date(item.extracted_date).toLocaleString()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        item.confidence_score >= 80
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {item.confidence_score}% Match Confidence
                    </Badge>
                  </div>
                </div>

                {/* Raw SMS Box */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border font-mono text-xs text-foreground/90 leading-relaxed">
                  "{item.raw_message}"
                </div>

                {/* Parsed Fields Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Extracted Amount</span>
                    <span className="font-bold text-sm text-foreground tabular mt-0.5 block">
                      {formatMoney(item.extracted_amount_minor, 'USD')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Merchant</span>
                    <span className="font-semibold text-foreground truncate mt-0.5 block">
                      {item.extracted_merchant || 'Unassigned'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Type</span>
                    <span className="font-semibold capitalize text-primary mt-0.5 block">
                      {item.extracted_type}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Reference #</span>
                    <span className="font-mono text-muted-foreground mt-0.5 block">
                      {item.extracted_ref || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Confirm Account & Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Review before saving to ledger</span>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(item.id)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Dismiss
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleApprove(item.id)}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Confirm & Save
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Interactive SMS Simulator Box */}
      <Card className="border border-border bg-card shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-primary" /> Test Mobile SMS Parser Engine
          </h3>
          <Badge variant="secondary" className="text-[10px]">Developer Sandbox</Badge>
        </div>

        <form onSubmit={handleSimulate} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Sender ID (e.g. CHASE, AMEX, HDFCBK)"
              value={simSender}
              onChange={(e) => setSimSender(e.target.value)}
              className="text-xs h-9"
            />
            <Input
              placeholder="Raw Bank SMS string"
              value={simMessage}
              onChange={(e) => setSimMessage(e.target.value)}
              className="text-xs h-9 sm:col-span-2"
            />
          </div>

          <Button type="submit" size="sm" disabled={simulateMutation.isPending} className="text-xs font-semibold">
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Parse & Simulate Incoming SMS
          </Button>
        </form>
      </Card>
    </div>
  );
};

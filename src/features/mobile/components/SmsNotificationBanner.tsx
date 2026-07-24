import React from 'react';
import { usePendingImportedTransactions } from '../hooks/useSmsImport';
import { MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SmsNotificationBannerProps {
  onOpenReview: () => void;
}

export const SmsNotificationBanner: React.FC<SmsNotificationBannerProps> = ({ onOpenReview }) => {
  const { data: pendingTxns = [] } = usePendingImportedTransactions();

  if (pendingTxns.length === 0) return null;

  const latest = pendingTxns[0];

  return (
    <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-background border border-primary/20 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
          <MessageSquare className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-foreground">
              New Financial SMS Detected ({pendingTxns.length})
            </span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold">
              <Sparkles className="h-3 w-3 mr-1" />
              {latest.confidence_score}% Confidence
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-lg">
            {latest.sender}: "{latest.raw_message}"
          </p>
        </div>
      </div>

      <Button size="sm" onClick={onOpenReview} className="text-xs font-bold shrink-0 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground">
        Review Now
        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
      </Button>
    </div>
  );
};

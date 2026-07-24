import React, { useState } from 'react';
import { ISO_CURRENCIES, searchCurrencies, CurrencyInfo } from '@/lib/currencies';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Check } from 'lucide-react';

interface CurrencyPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCurrency: string;
  onSelectCurrency: (currency: CurrencyInfo) => void;
}

export const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({
  open,
  onOpenChange,
  selectedCurrency,
  onSelectCurrency,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCurrencies = searchCurrencies(searchQuery);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border bg-muted/20 shrink-0">
          <DialogTitle className="text-lg font-bold">Select Currency</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose from global ISO-4217 currencies for your account or base preference.
          </DialogDescription>

          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by country, code (USD, NPR, EUR), or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2 divide-y divide-border/60 space-y-1">
          {filteredCurrencies.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No currencies match your search query.
            </p>
          ) : (
            filteredCurrencies.map((c) => {
              const isSelected = selectedCurrency.toUpperCase() === c.code.toUpperCase();
              return (
                <button
                  key={c.code}
                  onClick={() => {
                    onSelectCurrency(c);
                    onOpenChange(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-xs transition-colors ${
                    isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{c.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{c.code}</span>
                        <Badge variant="outline" className="text-[10px] font-mono py-0">
                          {c.symbol}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {c.name} • {c.country}
                      </p>
                    </div>
                  </div>

                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

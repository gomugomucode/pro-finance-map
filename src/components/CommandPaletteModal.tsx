import { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Wallet,
  PieChart,
  Target,
  HandCoins,
  Repeat,
  Tv,
  Calendar,
  FileSpreadsheet,
  Settings,
  ArrowRight,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenQuickAdd: () => void;
}

export function CommandPaletteModal({ open, onOpenChange, onOpenQuickAdd }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const navItems = [
    { label: "Dashboard", href: "/", icon: PieChart },
    { label: "Accounts", href: "/accounts", icon: Wallet },
    { label: "Budgets", href: "/budgets", icon: PieChart },
    { label: "Savings Goals", href: "/savings", icon: Target },
    { label: "Loans & Debts", href: "/loans", icon: HandCoins },
    { label: "Recurring Rules", href: "/recurring", icon: Repeat },
    { label: "Subscriptions", href: "/subscriptions", icon: Tv },
    { label: "Financial Calendar", href: "/calendar", icon: Calendar },
    { label: "Analytics & Health Score", href: "/analytics", icon: PieChart },
    { label: "Import & Export", href: "/import-export", icon: FileSpreadsheet },
    { label: "Settings & Audit Log", href: "/settings", icon: Settings },
  ];

  const filtered = navItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleNavigate = (href: string) => {
    router.navigate({ to: href });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-border bg-background shadow-2xl">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-border bg-muted/30">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search page..."
            className="border-0 shadow-none focus-visible:ring-0 text-sm py-4 h-12 bg-transparent"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Command Options List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {/* Action Trigger */}
          <button
            onClick={() => {
              onOpenChange(false);
              onOpenQuickAdd();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition group text-left text-sm font-medium text-foreground"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Plus className="h-4 w-4" />
              </div>
              <span>Create New Transaction</span>
            </div>
            <kbd className="h-5 inline-flex items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              N
            </kbd>
          </button>

          <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </div>

          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition text-left text-sm text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No matching pages or commands found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

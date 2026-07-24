import React, { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { WORKSPACE_CONFIGS, WorkspaceType } from "@/lib/modules";
import { getCurrencyInfo } from "@/lib/currencies";
import { CurrencyPickerModal } from "@/components/CurrencyPickerModal";
import { createAccount } from "@/lib/finance.functions";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toMinor } from "@/lib/money";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Wallet,
  Globe,
  Sun,
  Moon,
  Monitor,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onOpenChange }) => {
  const { profile, updateProfile } = useProfile();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const createAccountFn = useServerFn(createAccount);

  const [step, setStep] = useState(1);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceType>(
    profile?.workspaceType || "personal"
  );
  const [currency, setCurrency] = useState(profile?.baseCurrency || "USD");
  const [country, setCountry] = useState(profile?.country || "United States");
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);

  // Initial account setup
  const [accountName, setAccountName] = useState("Main Account");
  const [startingBalance, setStartingBalance] = useState("1000");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencyInfo = getCurrencyInfo(currency);

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save Profile metadata
      await updateProfile({
        workspaceType: selectedWorkspace,
        baseCurrency: currency,
        country,
        onboardingCompleted: true,
      });

      // 2. Create Initial Account if balance is entered
      if (accountName.trim()) {
        const balanceNumber = parseFloat(startingBalance) || 0;
        const balanceMinor = toMinor(balanceNumber);
        await createAccountFn({
          data: {
            name: accountName.trim(),
            type: selectedWorkspace === "business" ? "bank" : "checking",
            currency,
            opening_balance_minor: balanceMinor,
            current_balance_minor: balanceMinor,
            color: "#2563EB",
          },
        });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }

      toast.success("Welcome to Ledgerly! Your workspace is ready.");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to complete onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl bg-card border-border p-6 shadow-2xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                <Sparkles className="h-3 w-3 mr-1" /> Welcome to Ledgerly OS
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">Step {step} of 4</span>
            </div>
            <DialogTitle className="text-2xl font-extrabold tracking-tight">
              {step === 1 && "Choose Your Financial Workspace"}
              {step === 2 && "Regional & Currency Setup"}
              {step === 3 && "Personalize Your Visual Theme"}
              {step === 4 && "Set Up Your Primary Account"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {step === 1 && "Select an archetype to automatically tailor your dashboard, sidebar, and tools."}
              {step === 2 && "Choose your base operating currency and home country for ISO conversions."}
              {step === 3 && "Pick how Ledgerly looks across Light, Dark, or System mode."}
              {step === 4 && "Create your main account or cash wallet to get started right away."}
            </DialogDescription>
          </DialogHeader>

          {/* STEP 1: WORKSPACE TYPE SELECTION */}
          {step === 1 && (
            <div className="grid gap-3 py-3">
              {(Object.keys(WORKSPACE_CONFIGS) as WorkspaceType[]).map((key) => {
                const config = WORKSPACE_CONFIGS[key];
                const isSelected = selectedWorkspace === key;

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedWorkspace(key)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                        : "border-border/70 hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-2xl">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-foreground">{config.name}</h4>
                        <Badge variant="secondary" className="text-[10px]">
                          {config.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 2: REGION & CURRENCY */}
          {step === 2 && (
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Home Country</Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States, Nepal, India, United Kingdom"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Base Currency (ISO-4217)</Label>
                <button
                  type="button"
                  onClick={() => setCurrencyPickerOpen(true)}
                  className="w-full flex items-center justify-between px-3 h-10 rounded-lg border border-input bg-background text-xs font-semibold hover:bg-accent transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{currencyInfo.flag}</span>
                    <span className="font-bold">{currencyInfo.code}</span>
                    <span className="text-muted-foreground">({currencyInfo.name})</span>
                  </span>
                  <span className="font-mono text-xs text-primary font-bold">{currencyInfo.symbol}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: THEME AUDIT */}
          {step === 3 && (
            <div className="grid grid-cols-3 gap-3 py-4">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border space-y-2 transition ${
                  theme === "light"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <Sun className="h-6 w-6 text-amber-500" />
                <span className="text-xs font-bold">Light Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border space-y-2 transition ${
                  theme === "dark"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <Moon className="h-6 w-6 text-indigo-400" />
                <span className="text-xs font-bold">Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border space-y-2 transition ${
                  theme === "system"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <Monitor className="h-6 w-6 text-emerald-500" />
                <span className="text-xs font-bold">System Theme</span>
              </button>
            </div>
          )}

          {/* STEP 4: FIRST ACCOUNT */}
          {step === 4 && (
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Account Name</Label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Main Bank Account or Cash Wallet"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Opening Balance ({currencyInfo.symbol})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(e.target.value)}
                  className="text-xs h-9 font-mono font-bold"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between pt-3 border-t border-border">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(step - 1)}
                className="text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep(step + 1)}
                className="text-xs font-bold"
              >
                Continue <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="text-xs font-bold bg-primary text-primary-foreground shadow-sm"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Launch Workspace <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CurrencyPickerModal
        open={currencyPickerOpen}
        onOpenChange={setCurrencyPickerOpen}
        selectedCurrency={currency}
        onSelectCurrency={(c) => setCurrency(c.code)}
      />
    </>
  );
};

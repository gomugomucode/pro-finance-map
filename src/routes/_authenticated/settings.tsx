import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getProfile } from "@/lib/finance.functions";
import { useProfile } from "@/hooks/useProfile";
import { useTheme, ThemeMode } from "@/hooks/useTheme";
import { UserAvatar } from "@/components/UserAvatar";
import { CurrencyPickerModal } from "@/components/CurrencyPickerModal";
import { getCurrencyInfo } from "@/lib/currencies";
import { AuditLogViewer } from "@/features/settings/AuditLogViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User,
  Sun,
  Moon,
  Monitor,
  Globe,
  Languages,
  Bell,
  Eye,
  ShieldCheck,
  Check,
  Sparkles,
  Camera,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

const profileQuery = queryOptions({ queryKey: ["profile"], queryFn: () => getProfile() });

export const Route = createFileRoute("/_authenticated/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  component: SettingsPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive border border-destructive/20 rounded-xl bg-destructive/5 m-4">
      {error.message}
    </div>
  ),
});

function SettingsPage() {
  const { profile, updateProfile, isUpdating } = useProfile();
  const { theme, setTheme } = useTheme();
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);

  // Local Form Inputs
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [country, setCountry] = useState(profile?.country || "United States");
  const [language, setLanguage] = useState(profile?.language || "English");
  const [timezone, setTimezone] = useState(profile?.timezone || "America/New_York");

  // Notifications Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [budgetWarnings, setBudgetWarnings] = useState(true);

  // Privacy Toggles
  const [telemetry, setTelemetry] = useState(false);
  const [hideFrozen, setHideFrozen] = useState(false);

  const baseCcyInfo = getCurrencyInfo(profile?.baseCurrency || "USD");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      displayName,
      avatarUrl,
      country,
      language,
      timezone,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Settings & System Preferences
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customize your profile, base currency, theme appearance, regional formatting, and security settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        {/* Navigation Tabs */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-7 h-auto p-1 bg-card border border-border rounded-xl shadow-xs">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs py-2">
            <User className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1.5 text-xs py-2">
            <Sun className="h-3.5 w-3.5" /> Theme
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-1.5 text-xs py-2">
            <Globe className="h-3.5 w-3.5" /> Currency
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-1.5 text-xs py-2">
            <Languages className="h-3.5 w-3.5" /> Language
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs py-2">
            <Bell className="h-3.5 w-3.5" /> Alerts
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-1.5 text-xs py-2">
            <Eye className="h-3.5 w-3.5" /> Privacy
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs py-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
        </TabsList>

        {/* 1. Profile Section */}
        <TabsContent value="profile">
          <Card className="border border-border bg-card shadow-xs p-5 sm:p-6">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-border pb-5">
                <UserAvatar
                  displayName={displayName || profile?.displayName}
                  avatarUrl={avatarUrl || profile?.avatarUrl}
                  size="xl"
                />

                <div className="space-y-1.5 flex-1 w-full">
                  <Label className="text-xs font-semibold">Avatar Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="text-xs h-9"
                    />
                    <Button type="button" variant="outline" size="sm" className="text-xs shrink-0">
                      <Camera className="h-3.5 w-3.5 mr-1.5" />
                      Browse
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Anupam Baral"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Email Address</Label>
                  <Input
                    value={profile?.email || ""}
                    disabled
                    className="text-xs h-9 bg-muted/40 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Country / Region</Label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Timezone</Label>
                  <Input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="text-xs h-9 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isUpdating} size="sm" className="font-bold text-xs">
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* 2. Appearance Section */}
        <TabsContent value="appearance">
          <Card className="border border-border bg-card p-5 sm:p-6 space-y-5 shadow-xs">
            <div>
              <h3 className="font-bold text-base text-foreground">Theme & Interface Styling</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select your preferred color scheme. Light mode offers crisp cards inspired by Linear and Stripe.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ThemeCard
                title="Light Mode"
                subtitle="Clean, bright fintech interface"
                icon={Sun}
                isSelected={theme === 'light'}
                onClick={() => setTheme('light')}
              />

              <ThemeCard
                title="Dark Mode"
                subtitle="Sleek, high-contrast dark palette"
                icon={Moon}
                isSelected={theme === 'dark'}
                onClick={() => setTheme('dark')}
              />

              <ThemeCard
                title="System Mode"
                subtitle="Sync with OS light/dark schedule"
                icon={Monitor}
                isSelected={theme === 'system'}
                onClick={() => setTheme('system')}
              />
            </div>
          </Card>
        </TabsContent>

        {/* 3. Currency Section */}
        <TabsContent value="currency">
          <Card className="border border-border bg-card p-5 sm:p-6 space-y-5 shadow-xs">
            <div>
              <h3 className="font-bold text-base text-foreground">Base Account Currency</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set your primary reporting currency across dashboard totals and analytics.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{baseCcyInfo.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{baseCcyInfo.code}</span>
                    <Badge variant="outline" className="text-xs font-mono">{baseCcyInfo.symbol}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{baseCcyInfo.name} • {baseCcyInfo.country}</p>
                </div>
              </div>

              <Button size="sm" onClick={() => setCurrencyPickerOpen(true)} className="text-xs font-semibold">
                Change Base Currency
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 4. Language Section */}
        <TabsContent value="language">
          <Card className="border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-foreground">Language & Regional Preferences</h3>

            <div className="space-y-1.5 max-w-sm">
              <Label className="text-xs font-semibold">Display Language</Label>
              <Select value={language} onValueChange={(val) => { setLanguage(val); updateProfile({ language: val }); }}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="English" className="text-xs">🇺🇸 English (US)</SelectItem>
                  <SelectItem value="Nepali" className="text-xs">🇳🇵 Nepali (नेपाली)</SelectItem>
                  <SelectItem value="Hindi" className="text-xs">🇮🇳 Hindi (हिंदी)</SelectItem>
                  <SelectItem value="Spanish" className="text-xs">🇪🇸 Spanish (Español)</SelectItem>
                  <SelectItem value="German" className="text-xs">🇩🇪 German (Deutsch)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </TabsContent>

        {/* 5. Notifications Section */}
        <TabsContent value="notifications">
          <Card className="border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-foreground">Alerts & Notifications</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <span className="font-semibold text-foreground block">Email Digest Reports</span>
                  <span className="text-[11px] text-muted-foreground">Receive weekly spending summaries</span>
                </div>
                <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <span className="font-semibold text-foreground block">SMS Transaction Alerts</span>
                  <span className="text-[11px] text-muted-foreground">Push alerts on unreviewed bank SMS</span>
                </div>
                <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <span className="font-semibold text-foreground block">Budget Limit Thresholds</span>
                  <span className="text-[11px] text-muted-foreground">Warn when category reaches 85% limit</span>
                </div>
                <Switch checked={budgetWarnings} onCheckedChange={setBudgetWarnings} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 6. Privacy Section */}
        <TabsContent value="privacy">
          <Card className="border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-foreground">Data Privacy & Security Controls</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <span className="font-semibold text-foreground block">Hide Frozen Accounts</span>
                  <span className="text-[11px] text-muted-foreground">Omit locked accounts from dashboard charts</span>
                </div>
                <Switch checked={hideFrozen} onCheckedChange={setHideFrozen} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <span className="font-semibold text-foreground block">Anonymous Usage Telemetry</span>
                  <span className="text-[11px] text-muted-foreground">Help improve Ledgerly with crash metrics</span>
                </div>
                <Switch checked={telemetry} onCheckedChange={setTelemetry} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 7. Security Section */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Security Audit Log
            </h3>
            <AuditLogViewer />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Currency Search Picker Modal */}
      <CurrencyPickerModal
        open={currencyPickerOpen}
        onOpenChange={setCurrencyPickerOpen}
        selectedCurrency={profile?.baseCurrency || "USD"}
        onSelectCurrency={(c) => updateProfile({ baseCurrency: c.code })}
      />
    </div>
  );
}

function ThemeCard({
  title,
  subtitle,
  icon: Icon,
  isSelected,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: any;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 ${
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border hover:border-primary/50 bg-muted/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-lg bg-background border flex items-center justify-center text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {isSelected && <Check className="h-4 w-4 text-primary font-bold" />}
      </div>

      <div>
        <h4 className="font-bold text-xs text-foreground">{title}</h4>
        <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getProfile } from "@/lib/finance.functions";
import { useProfile } from "@/hooks/useProfile";
import { useTheme, ThemeMode } from "@/hooks/useTheme";
import { UserAvatar } from "@/components/UserAvatar";
import { CurrencyPickerModal } from "@/components/CurrencyPickerModal";
import { getCurrencyInfo } from "@/lib/currencies";
import { WORKSPACE_CONFIGS, MODULE_REGISTRY, WorkspaceType } from "@/lib/modules";
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
  Layers,
  Lock,
  Loader2,
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
  const [timezone, setTimezone] = useState(profile?.timezone || "UTC");
  const [baseCurrency, setBaseCurrency] = useState(profile?.baseCurrency || "USD");

  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>(profile?.workspaceType || "personal");
  const [betaFeatures, setBetaFeatures] = useState(profile?.betaFeaturesEnabled || false);
  const [disabledModules, setDisabledModules] = useState<string[]>(profile?.disabledModules || []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      displayName,
      avatarUrl,
      country,
      language,
      timezone,
      baseCurrency,
      workspaceType,
      betaFeaturesEnabled: betaFeatures,
      disabledModules,
    });
  };

  const toggleModule = (modId: string) => {
    if (disabledModules.includes(modId)) {
      setDisabledModules(disabledModules.filter((id) => id !== modId));
    } else {
      setDisabledModules([...disabledModules, modId]);
    }
  };

  const ccyInfo = getCurrencyInfo(baseCurrency);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          Settings & Preferences
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Customize your profile, active workspace archetype, module visibility, theme tokens, and security settings.
        </p>
      </div>

      <Tabs defaultValue="workspace" className="space-y-6">
        {/* Navigation Tabs */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-8 h-auto p-1 bg-card border border-border rounded-xl shadow-xs">
          <TabsTrigger value="workspace" className="flex items-center gap-1 text-xs py-2">
            <Layers className="h-3.5 w-3.5" /> Workspace
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-1 text-xs py-2">
            <User className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1 text-xs py-2">
            <Sun className="h-3.5 w-3.5" /> Theme
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-1 text-xs py-2">
            <Globe className="h-3.5 w-3.5" /> Currency
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-1 text-xs py-2">
            <Languages className="h-3.5 w-3.5" /> Language
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs py-2">
            <Bell className="h-3.5 w-3.5" /> Alerts
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-1 text-xs py-2">
            <Eye className="h-3.5 w-3.5" /> Privacy
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1 text-xs py-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
        </TabsList>

        {/* 0. Workspace & Modules Section */}
        <TabsContent value="workspace">
          <Card className="border border-border bg-card shadow-xs p-5 sm:p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Active Workspace Archetype
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Switch workspace to dynamically reorganize your sidebar navigation and dashboard layout.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(WORKSPACE_CONFIGS) as WorkspaceType[]).map((key) => {
                const config = WORKSPACE_CONFIGS[key];
                const isSelected = workspaceType === key;

                return (
                  <div
                    key={key}
                    onClick={() => setWorkspaceType(key)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/70 hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-2xl">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-foreground">{config.name}</h4>
                        <Badge variant="secondary" className="text-[10px]">
                          {config.badge}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{config.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature Flags */}
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Beta & Experimental Feature Flags</h4>
                  <p className="text-[11px] text-muted-foreground">Unlock upcoming Ledgerly features before general release.</p>
                </div>
                <Switch checked={betaFeatures} onCheckedChange={setBetaFeatures} />
              </div>
            </div>

            {/* Module Registry Manager */}
            <div className="pt-4 border-t border-border space-y-3">
              <div>
                <h4 className="text-xs font-bold text-foreground">Module Manager & Visibility</h4>
                <p className="text-[11px] text-muted-foreground">Toggle individual tools on or off. Disabling only hides UI—zero data is ever deleted.</p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {MODULE_REGISTRY.map((mod) => {
                  const isDisabled = disabledModules.includes(mod.id);
                  const Icon = mod.icon;

                  return (
                    <div key={mod.id} className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/20">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground">{mod.name}</span>
                            {mod.isCore && (
                              <Badge variant="outline" className="text-[9px] bg-muted py-0">
                                <Lock className="h-2.5 w-2.5 mr-0.5" /> Core
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{mod.navigationGroup}</span>
                        </div>
                      </div>

                      {!mod.isCore ? (
                        <Switch checked={!isDisabled} onCheckedChange={() => toggleModule(mod.id)} />
                      ) : (
                        <Switch checked disabled />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button onClick={handleSaveProfile} size="sm" disabled={isUpdating} className="text-xs font-bold bg-primary text-primary-foreground">
                {isUpdating && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Save Workspace Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

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
                <Button type="submit" size="sm" disabled={isUpdating} className="text-xs font-bold">
                  {isUpdating && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Save Profile
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* 2. Appearance & Theme Section */}
        <TabsContent value="appearance">
          <Card className="border border-border bg-card shadow-xs p-5 sm:p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Theme Preference</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose your visual mode across all components, charts, and dialogs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border space-y-3 cursor-pointer transition ${
                  theme === "light"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <Sun className="h-8 w-8 text-amber-500" />
                <div className="text-center">
                  <span className="text-xs font-bold block">Light Theme</span>
                  <span className="text-[10px] text-muted-foreground">Soft gray background (#F8FAFC)</span>
                </div>
                {theme === "light" && <Check className="h-4 w-4 text-primary" />}
              </div>

              <div
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border space-y-3 cursor-pointer transition ${
                  theme === "dark"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <Moon className="h-8 w-8 text-indigo-400" />
                <div className="text-center">
                  <span className="text-xs font-bold block">Dark Theme</span>
                  <span className="text-[10px] text-muted-foreground">Deep slate dark mode (#090D16)</span>
                </div>
                {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
              </div>

              <div
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border space-y-3 cursor-pointer transition ${
                  theme === "system"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <Monitor className="h-8 w-8 text-emerald-500" />
                <div className="text-center">
                  <span className="text-xs font-bold block">System Preference</span>
                  <span className="text-[10px] text-muted-foreground">Sync automatically with OS</span>
                </div>
                {theme === "system" && <Check className="h-4 w-4 text-primary" />}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 3. Base Currency Section */}
        <TabsContent value="currency">
          <Card className="border border-border bg-card shadow-xs p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-foreground">Base Currency Settings</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set your main operating currency for net worth calculations and dashboard summaries.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{ccyInfo.flag}</span>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    {ccyInfo.code} — {ccyInfo.name}
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {ccyInfo.symbol}
                    </Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">{ccyInfo.country}</p>
                </div>
              </div>

              <Button
                onClick={() => setCurrencyPickerOpen(true)}
                size="sm"
                variant="outline"
                className="text-xs font-semibold"
              >
                Change Currency
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 4. Language & Localization */}
        <TabsContent value="language">
          <Card className="border border-border bg-card shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Language & Regional Format</h3>
            <div className="max-w-xs space-y-1.5">
              <Label className="text-xs font-semibold">Display Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English" className="text-xs">English (US)</SelectItem>
                  <SelectItem value="Nepali" className="text-xs">Nepali (नेपाली)</SelectItem>
                  <SelectItem value="Hindi" className="text-xs">Hindi (हिंदी)</SelectItem>
                  <SelectItem value="Spanish" className="text-xs">Spanish (Español)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </TabsContent>

        {/* 5. Notifications */}
        <TabsContent value="notifications">
          <Card className="border border-border bg-card shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Alert & Notification Preferences</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <span className="font-semibold block">Budget Overspend Alerts</span>
                  <span className="text-[11px] text-muted-foreground">Notify when category spending reaches 90% limit</span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <span className="font-semibold block">Upcoming Recurring Bills</span>
                  <span className="text-[11px] text-muted-foreground">Remind 3 days before scheduled due dates</span>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 6. Privacy */}
        <TabsContent value="privacy">
          <Card className="border border-border bg-card shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Privacy & Data Visibility</h3>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border text-xs">
              <div>
                <span className="font-semibold block">Mask Financial Values on Screen</span>
                <span className="text-[11px] text-muted-foreground">Hide monetary values when recording or demoing</span>
              </div>
              <Switch />
            </div>
          </Card>
        </TabsContent>

        {/* 7. Security Audit Log */}
        <TabsContent value="security">
          <Card className="border border-border bg-card shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Security Audit Logs</h3>
            <AuditLogViewer />
          </Card>
        </TabsContent>
      </Tabs>

      <CurrencyPickerModal
        open={currencyPickerOpen}
        onOpenChange={setCurrencyPickerOpen}
        selectedCurrency={baseCurrency}
        onSelectCurrency={(c) => {
          setBaseCurrency(c.code);
          updateProfile({ baseCurrency: c.code });
        }}
      />
    </div>
  );
}

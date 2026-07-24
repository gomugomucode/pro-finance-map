import { useState, useEffect } from "react";
import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationCenter } from "@/components/NotificationCenter";
import { QuickAddTransaction } from "@/features/transactions/QuickAddTransaction";
import { CommandPaletteModal } from "@/components/CommandPaletteModal";
import { UserAvatar } from "@/components/UserAvatar";
import { useProfile } from "@/hooks/useProfile";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { OnboardingModal } from "@/components/OnboardingModal";
import { getVisibleModules, NavigationGroup } from "@/lib/modules";
import { LogOut, Plus, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
  errorComponent: ({ error, reset }) => (
    <div className="flex h-screen w-full flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  ),
});

function AppLayout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // Onboarding Modal Trigger
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (profile && profile.onboardingCompleted === false) {
      setOnboardingOpen(true);
    }
  }, [profile]);

  // Global Keyboard Listener (Ctrl+K, Cmd+K, N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        (e.target as HTMLElement)?.tagName
      );

      // Ctrl+K / Cmd+K -> Open Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
        return;
      }

      // N key -> Open Quick Add (when not typing in form inputs)
      if (!isInput && e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const onSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  // Dynamic Navigation Items from Module Registry
  const visibleModules = getVisibleModules(
    profile?.workspaceType || "personal",
    profile?.disabledModules || [],
    profile?.betaFeaturesEnabled || false
  );

  // Group modules by navigationGroup
  const groups: NavigationGroup[] = [
    "Core",
    "Planning & Goals",
    "Evidence & Vault",
    "Business & Analytics",
    "Wealth & Liabilities",
    "System",
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-sm">
              L
            </div>
            <span className="text-base font-extrabold tracking-tight text-foreground">Ledgerly OS</span>
          </Link>
          <NotificationCenter />
        </div>

        {/* Workspace Switcher Component */}
        <div className="p-3 border-b border-sidebar-border bg-sidebar-accent/30">
          <WorkspaceSwitcher />
        </div>

        {/* Global Quick Add Button */}
        <div className="p-3 border-b border-sidebar-border">
          <Button
            onClick={() => setQuickAddOpen(true)}
            className="w-full justify-start shadow-xs font-semibold"
            size="sm"
          >
            <Zap className="mr-2 h-4 w-4 text-primary-foreground" />
            Quick Entry
            <kbd className="ml-auto font-mono text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded">
              N
            </kbd>
          </Button>
        </div>

        {/* Dynamic Sidebar Groups */}
        <nav className="flex-1 space-y-4 px-3 py-3 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {groups.map((groupName) => {
            const groupModules = visibleModules.filter((m) => m.navigationGroup === groupName);
            if (groupModules.length === 0) return null;

            return (
              <div key={groupName} className="space-y-1">
                <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70 block">
                  {groupName}
                </span>
                {groupModules.map((m) => {
                  const Icon = m.icon;
                  return (
                    <Link
                      key={m.id}
                      to={m.route}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeProps={{
                        className:
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold bg-sidebar-accent text-sidebar-accent-foreground shadow-2xs",
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{m.shortName || m.name}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Card & Sign Out Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <Link
            to="/settings"
            className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 hover:bg-muted border border-border/60 transition"
          >
            <UserAvatar
              displayName={profile?.displayName}
              avatarUrl={profile?.avatarUrl}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{profile?.displayName || "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{profile?.email}</p>
            </div>
          </Link>

          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 text-xs"
            onClick={onSignOut}
          >
            <LogOut className="mr-2 h-4 w-4 text-destructive" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar for Desktop & Mobile */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4 bg-sidebar">
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
                L
              </div>
            </Link>
            <WorkspaceSwitcher />
          </div>

          {/* Search / Command Bar Trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg hover:border-primary transition w-64"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search or command...</span>
            <kbd className="ml-auto font-mono text-[10px] bg-background border px-1 rounded">
              Ctrl+K
            </kbd>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickAddOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>Quick Entry</span>
            </Button>
            <div className="md:hidden">
              <NotificationCenter />
            </div>
            <Link to="/settings">
              <UserAvatar
                displayName={profile?.displayName}
                avatarUrl={profile?.avatarUrl}
                size="sm"
                className="hidden sm:inline-flex hover:ring-2 hover:ring-primary/40 transition cursor-pointer"
              />
            </Link>
            <Button variant="ghost" size="sm" onClick={onSignOut} className="md:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Global Floating Modals */}
        <QuickAddTransaction open={quickAddOpen} onOpenChange={setQuickAddOpen} />
        <CommandPaletteModal open={cmdOpen} onOpenChange={setCmdOpen} onOpenQuickAdd={() => setQuickAddOpen(true)} />
        <OnboardingModal open={onboardingOpen} onOpenChange={setOnboardingOpen} />
      </div>
    </div>
  );
}

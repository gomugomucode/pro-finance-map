import { useState, useEffect } from "react";
import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationCenter } from "@/components/NotificationCenter";
import { QuickAddTransaction } from "@/features/transactions/QuickAddTransaction";
import { CommandPaletteModal } from "@/components/CommandPaletteModal";
import { UserAvatar } from "@/components/UserAvatar";
import { useProfile } from "@/hooks/useProfile";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  PieChart,
  PiggyBank,
  HandCoins,
  Repeat,
  Tv,
  Calendar,
  BarChart3,
  Bell,
  Download,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Search,
  Zap,
  Store,
  Landmark,
  FileText,
} from "lucide-react";
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
    return { user: data.user };
  },
  component: AppLayout,
  errorComponent: ({ error, reset }) => (
    <div className="p-8">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  ),
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vault", label: "Receipt Vault", icon: FileText },
  { to: "/wealth", label: "Wealth & Net Worth", icon: Landmark },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/merchants", label: "Merchants", icon: Store },
  { to: "/budgets", label: "Budgets", icon: PieChart },
  { to: "/savings", label: "Savings Goals", icon: PiggyBank },
  { to: "/loans", label: "Loans & Debts", icon: HandCoins },
  { to: "/recurring", label: "Recurring", icon: Repeat },
  { to: "/subscriptions", label: "Subscriptions", icon: Tv },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/import-export", label: "Import/Export", icon: Download },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function AppLayout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-sm">
              L
            </div>
            <span className="text-base font-semibold tracking-tight">Ledgerly OS</span>
          </div>
          <NotificationCenter />
        </div>

        {/* Global Quick Add Button in Sidebar */}
        <div className="p-3 border-b border-sidebar-border">
          <Button
            onClick={() => setQuickAddOpen(true)}
            className="w-full justify-start shadow-sm font-semibold"
            size="sm"
          >
            <Zap className="mr-2 h-4 w-4 text-primary-foreground" />
            Quick Add
            <kbd className="ml-auto font-mono text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded">
              N
            </kbd>
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold bg-sidebar-accent text-sidebar-accent-foreground",
              }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>

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
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar for Desktop & Mobile */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4 bg-sidebar">
          <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
              L
            </div>
            <span className="text-sm font-semibold">Ledgerly</span>
          </Link>

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
              className="hidden sm:inline-flex items-center gap-1.5 text-xs"
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

        {/* Mobile Floating Action Button (FAB) for Instant Quick Add */}
        <div className="fixed bottom-16 right-4 z-40 md:hidden">
          <Button
            onClick={() => setQuickAddOpen(true)}
            size="icon"
            className="h-14 w-14 rounded-full shadow-2xl bg-primary text-primary-foreground flex items-center justify-center border-2 border-background"
          >
            <Plus className="h-7 w-7" />
          </Button>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-border bg-sidebar md:hidden">
          {nav.slice(0, 5).map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] text-sidebar-foreground/70"
              activeProps={{
                className:
                  "flex flex-col items-center justify-center gap-1 py-2 text-[10px] text-primary font-bold",
              }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Global Quick Add Dialog */}
      <QuickAddTransaction open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      {/* Global Command Palette */}
      <CommandPaletteModal
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onOpenQuickAdd={() => setQuickAddOpen(true)}
      />
    </div>
  );
}

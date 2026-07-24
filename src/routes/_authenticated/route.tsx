import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationCenter } from "@/components/NotificationCenter";
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
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/categories", label: "Categories", icon: Tags },
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

  const onSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              L
            </div>
            <span className="text-base font-semibold tracking-tight">Ledgerly OS</span>
          </div>
          <NotificationCenter />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto max-h-[calc(100vh-8rem)]">
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

        <div className="border-t border-sidebar-border p-3">
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
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden bg-sidebar">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
              L
            </div>
            <span className="text-sm font-semibold">Ledgerly</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationCenter />
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom navigation */}
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
    </div>
  );
}

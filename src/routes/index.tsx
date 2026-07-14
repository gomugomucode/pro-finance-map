import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Wallet,
  PieChart,
  ArrowLeftRight,
  ShieldCheck,
  Sparkles,
  LineChart,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Ledgerly</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/auth"
              className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pt-20 pb-24 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Personal finance, reimagined
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
              Your money,{" "}
              <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                in focus.
              </span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Track every account, every transaction, every category — across cash, banks,
              wallets and cards. Answer the questions your money keeps asking you.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-5 py-3 text-sm font-medium hover:bg-accent"
              >
                I already have an account
              </Link>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Wallet, title: "All accounts", body: "Cash, banks, wallets, cards, credit — unified." },
              { icon: ArrowLeftRight, title: "Transfers", body: "Move money between accounts, balances update instantly." },
              { icon: PieChart, title: "Categories", body: "See where your money actually goes each month." },
              { icon: LineChart, title: "Cash flow", body: "Income vs expense over time, at a glance." },
            ].map((f) => (
              <div key={f.title} className="card-elevated p-5">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                  <f.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-4 font-medium">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 card-elevated overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-2">
              <div className="p-8 lg:p-12">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Answers, not spreadsheets.
                </h2>
                <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                  {[
                    "Where is my money going this month?",
                    "How much cash vs bank do I actually have?",
                    "Which categories are eating my budget?",
                    "What was my net worth 3 months ago?",
                  ].map((q) => (
                    <li key={q} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-border bg-surface/60 p-8 lg:border-t-0 lg:border-l lg:p-12">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Bank-grade security by default
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Your data lives in an encrypted database with row-level security. Only you
                  can read your accounts and transactions.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Ledgerly</span>
            <span>Built on Lovable Cloud</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

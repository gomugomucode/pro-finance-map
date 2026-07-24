import { createFileRoute } from "@tanstack/react-router";
import { NetWorthDashboard } from "@/features/wealth/NetWorthDashboard";
import { AssetList } from "@/features/wealth/AssetList";
import { LiabilityList } from "@/features/wealth/LiabilityList";
import { InvestmentPortfolio } from "@/features/wealth/InvestmentPortfolio";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Landmark, Scale, CreditCard, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wealth")({
  component: WealthPage,
});

function WealthPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Landmark className="h-6 w-6 text-primary" /> Personal Wealth & Net Worth Center
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track everything you own and owe: real estate, vehicles, gold, stocks, crypto, bank deposits, mortgages, and liabilities.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs">
            <Scale className="h-3.5 w-3.5" /> Net Worth Overview
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-1.5 text-xs">
            <Landmark className="h-3.5 w-3.5" /> Assets & Valuation
          </TabsTrigger>
          <TabsTrigger value="liabilities" className="flex items-center gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5" /> Liabilities & Debts
          </TabsTrigger>
          <TabsTrigger value="investments" className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" /> Investments Portfolio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <NetWorthDashboard />
        </TabsContent>

        <TabsContent value="assets">
          <AssetList />
        </TabsContent>

        <TabsContent value="liabilities">
          <LiabilityList />
        </TabsContent>

        <TabsContent value="investments">
          <InvestmentPortfolio />
        </TabsContent>
      </Tabs>
    </div>
  );
}

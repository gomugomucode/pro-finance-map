import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listMerchants } from "@/lib/finance.functions";
import { MerchantList } from "@/features/merchants/MerchantList";
import { MerchantAnalytics } from "@/features/merchants/MerchantAnalytics";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Store, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/merchants")({
  component: MerchantsPage,
});

function MerchantsPage() {
  const { data: merchants = [], isLoading } = useQuery({
    queryKey: ["merchants"],
    queryFn: () => listMerchants(),
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" /> Merchant Intelligence Engine
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Ledgerly automatically learns vendor spending habits, preferred categories, and payment accounts over time.
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs">
            <Store className="h-3.5 w-3.5" /> All Merchants ({merchants.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Analytics & Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <MerchantList merchants={merchants} />
        </TabsContent>

        <TabsContent value="analytics">
          <MerchantAnalytics merchants={merchants} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

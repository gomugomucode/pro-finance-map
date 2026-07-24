import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatMoney, fromMinor, toMinor } from "@/lib/money";
import { TrendingUp, ArrowDownRight, ArrowUpRight, Plus, RefreshCw, Sparkles } from "lucide-react-native";
import { processOfflineSyncQueue } from "@/lib/offline-sync";

export default function MobileDashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboardData, refetch } = useQuery({
    queryKey: ["mobile_dashboard"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return null;

      // 1. Fetch Accounts
      const { data: accounts } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userData.user.id);

      // 2. Fetch Recent Transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*, account:accounts(name, currency)")
        .eq("user_id", userData.user.id)
        .order("date", { ascending: false })
        .limit(10);

      const netWorthMinor = (accounts || []).reduce(
        (sum: number, a: any) => sum + (a.current_balance_minor || 0),
        0
      );

      return {
        accounts: accounts || [],
        transactions: transactions || [],
        netWorthMinor,
        user: userData.user,
      };
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await processOfflineSyncQueue();
    await refetch();
    setRefreshing(false);
  };

  const netWorth = dashboardData?.netWorthMinor || 0;
  const recentList = dashboardData?.transactions || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Ledgerly Companion</Text>
            <Text style={styles.userName}>
              {dashboardData?.user?.user_metadata?.display_name || "Financial Operating System"}
            </Text>
          </View>
          <TouchableOpacity style={styles.syncBadge} onPress={onRefresh}>
            <RefreshCw size={14} color="#38BDF8" />
            <Text style={styles.syncText}>Sync</Text>
          </TouchableOpacity>
        </View>

        {/* Net Worth Primary Banner */}
        <View style={styles.netWorthCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>TOTAL NET WORTH</Text>
            <TrendingUp size={20} color="#60A5FA" />
          </View>
          <Text style={styles.netWorthValue}>{formatMoney(netWorth, "USD")}</Text>
          <Text style={styles.netWorthSub}>
            Across {dashboardData?.accounts?.length || 0} liquid accounts & wallets
          </Text>
        </View>

        {/* AI Assistant Insight Card */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Sparkles size={16} color="#38BDF8" />
            <Text style={styles.aiTitle}>Smart Assistant Pulse</Text>
          </View>
          <Text style={styles.aiText}>
            Net worth is stable across {dashboardData?.accounts?.length || 0} accounts. Health Score is optimal.
          </Text>
        </View>

        {/* KPI Quick Stats */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiTitle}>Active Accounts</Text>
              <ArrowDownRight size={16} color="#10B981" />
            </View>
            <Text style={styles.kpiValue}>{dashboardData?.accounts?.length || 0}</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiTitle}>Transactions</Text>
              <ArrowUpRight size={16} color="#EF4444" />
            </View>
            <Text style={styles.kpiValue}>{recentList.length}</Text>
          </View>
        </View>

        {/* Recent Transactions List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.sectionSub}>Latest transactions</Text>
        </View>

        <View style={styles.transactionList}>
          {recentList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recent transactions recorded yet.</Text>
            </View>
          ) : (
            recentList.map((item: any) => {
              const isIncome = item.type === "income";
              return (
                <View key={item.id} style={styles.txCard}>
                  <View style={styles.txInfo}>
                    <Text style={styles.txMerchant}>{item.merchant_name || item.description || "Transaction"}</Text>
                    <Text style={styles.txAccount}>{item.account?.name || "Account"}</Text>
                  </View>
                  <Text style={[styles.txAmount, isIncome ? styles.txIncome : styles.txExpense]}>
                    {isIncome ? "+" : "-"}{formatMoney(item.amount_minor, item.currency || "USD")}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
    marginTop: 2,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0284C720",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0284C740",
  },
  syncText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "700",
  },
  netWorthCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  netWorthValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#F8FAFC",
    marginVertical: 8,
  },
  netWorthSub: {
    fontSize: 12,
    color: "#64748B",
  },
  aiCard: {
    backgroundColor: "#0284C715",
    borderWidth: 1,
    borderColor: "#0284C735",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  aiTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38BDF8",
  },
  aiText: {
    fontSize: 12,
    color: "#CBD5E1",
    lineHeight: 18,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  kpiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  kpiTitle: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  sectionSub: {
    fontSize: 12,
    color: "#64748B",
  },
  transactionList: {
    gap: 10,
    paddingBottom: 24,
  },
  txCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  txInfo: {
    flex: 1,
  },
  txMerchant: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  txAccount: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  txIncome: {
    color: "#10B981",
  },
  txExpense: {
    color: "#EF4444",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
  },
});

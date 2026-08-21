import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatMoney, toMinor } from "@/lib/money";
import { Plus, Search, Trash2, ArrowDownRight, ArrowUpRight } from "lucide-react-native";
import { queueOfflineMutation, processOfflineSyncQueue } from "@/lib/offline-sync";

export default function TransactionsScreen() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");

  const queryClient = useQueryClient();

  const { data: transactions, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile_transactions"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return [];

      const { data } = await supabase
        .from("transactions")
        .select("*, account:accounts!account_id(name, currency)")
        .eq("user_id", userData.user.id)
        .order("occurred_at", { ascending: false });

      return data || [];
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ["mobile_accounts"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return [];
      const { data } = await supabase.from("accounts").select("*").eq("user_id", userData.user.id);
      return data || [];
    },
  });

  const handleAddTransaction = async () => {
    if (!merchant.trim() || !amount.trim()) {
      Alert.alert("Error", "Please enter merchant name and amount.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const firstAccount = accounts && accounts.length > 0 ? accounts[0] : null;
    if (!firstAccount) {
      Alert.alert("No Account", "Please create a bank account first.");
      return;
    }

    const amountNum = parseFloat(amount) || 0;
    const amountMinor = toMinor(amountNum);

    const payload = {
      user_id: userData.user.id,
      account_id: firstAccount.id,
      merchant: merchant.trim(),
      description: merchant.trim(),
      amount_minor: amountMinor,
      base_amount_minor: amountMinor,
      kind: type,
      currency: firstAccount.currency || "USD",
      occurred_at: new Date().toISOString(),
    };

    try {
      // Try online insert
      const { error } = await supabase.from("transactions").insert(payload);
      if (error) throw error;
    } catch {
      // Fallback to Offline Queue
      await queueOfflineMutation("transactions", "INSERT", payload);
      Alert.alert("Saved Offline", "Transaction queued and will sync when online.");
    }

    setModalOpen(false);
    setMerchant("");
    setAmount("");
    queryClient.invalidateQueries({ queryKey: ["mobile_transactions"] });
    queryClient.invalidateQueries({ queryKey: ["mobile_dashboard"] });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    } catch {
      await queueOfflineMutation("transactions", "DELETE", { id });
    }
    queryClient.invalidateQueries({ queryKey: ["mobile_transactions"] });
    queryClient.invalidateQueries({ queryKey: ["mobile_dashboard"] });
  };

  const filteredList = (transactions || []).filter((tx: any) =>
    (tx.merchant || tx.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalOpen(true)}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addText}>Quick Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={16} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search merchant or category..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={async () => {
              await processOfflineSyncQueue();
              refetch();
            }}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const isIncome = item.kind === "income";
          return (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.typeIcon, isIncome ? styles.incBg : styles.expBg]}>
                  {isIncome ? (
                    <ArrowDownRight size={18} color="#10B981" />
                  ) : (
                    <ArrowUpRight size={18} color="#EF4444" />
                  )}
                </View>
                <View>
                  <Text style={styles.merchant}>{item.merchant || item.description || "Transaction"}</Text>
                  <Text style={styles.subText}>
                    {item.account?.name || "Account"} • {item.occurred_at ? new Date(item.occurred_at).toLocaleDateString() : ""}
                  </Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                <Text style={[styles.amount, isIncome ? styles.incText : styles.expText]}>
                  {isIncome ? "+" : "-"}{formatMoney(item.amount_minor, item.currency || "USD")}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Trash2 size={14} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Add Transaction Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Transaction</Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeBtn, type === "expense" && styles.typeBtnActiveExp]}
                onPress={() => setType("expense")}
              >
                <Text style={[styles.typeText, type === "expense" && styles.typeTextActive]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === "income" && styles.typeBtnActiveInc]}
                onPress={() => setType("income")}
              >
                <Text style={[styles.typeText, type === "income" && styles.typeTextActive]}>Income</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Merchant / Payee Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Starbucks, Amazon, Salary"
                placeholderTextColor="#64748B"
                value={merchant}
                onChangeText={setMerchant}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddTransaction}>
                <Text style={styles.submitText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: "#F8FAFC",
    fontSize: 13,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  incBg: {
    backgroundColor: "#10B98120",
  },
  expBg: {
    backgroundColor: "#EF444420",
  },
  merchant: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  subText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: "800",
  },
  incText: {
    color: "#10B981",
  },
  expText: {
    color: "#EF4444",
  },
  deleteBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
  },
  typeBtnActiveExp: {
    backgroundColor: "#EF444420",
    borderColor: "#EF4444",
  },
  typeBtnActiveInc: {
    backgroundColor: "#10B98120",
    borderColor: "#10B981",
  },
  typeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },
  typeTextActive: {
    color: "#F8FAFC",
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  input: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F8FAFC",
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cancelText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});

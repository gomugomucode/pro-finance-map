import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatMoney, toMinor } from "@/lib/money";
import { Wallet, Plus, Building2, CreditCard, PiggyBank, Lock } from "lucide-react-native";
import { queueOfflineMutation } from "@/lib/offline-sync";

export default function AccountsScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("1000");
  const [currency, setCurrency] = useState("USD");

  const queryClient = useQueryClient();

  const { data: accounts, isLoading, refetch } = useQuery({
    queryKey: ["mobile_accounts_list"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return [];

      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userData.user.id);

      return data || [];
    },
  });

  const handleCreateAccount = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter account name.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const balanceNum = parseFloat(balance) || 0;
    const balanceMinor = toMinor(balanceNum);

    const payload = {
      user_id: userData.user.id,
      name: name.trim(),
      type: "bank" as const,
      currency: currency.trim().toUpperCase(),
      opening_balance_minor: balanceMinor,
      current_balance_minor: balanceMinor,
      color: "#2563EB",
    };

    try {
      const { error } = await supabase.from("accounts").insert(payload);
      if (error) throw error;
    } catch {
      await queueOfflineMutation("accounts", "INSERT", payload);
      Alert.alert("Saved Offline", "Account queued for sync.");
    }

    setModalOpen(false);
    setName("");
    setBalance("0");
    queryClient.invalidateQueries({ queryKey: ["mobile_accounts_list"] });
    queryClient.invalidateQueries({ queryKey: ["mobile_dashboard"] });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Accounts & Wallets</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalOpen(true)}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addText}>Add Bank</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={accounts || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <Wallet size={20} color="#2563EB" />
              </View>
              <View style={styles.titleGroup}>
                <Text style={styles.accountName}>{item.name}</Text>
                <Text style={styles.accountType}>{item.type.toUpperCase()} • {item.currency}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
              <Text style={styles.balanceValue}>
                {formatMoney(item.current_balance_minor, item.currency)}
              </Text>
            </View>
          </View>
        )}
      />

      {/* New Account Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Bank Account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Chase Checking or Nabil Savings"
                placeholderTextColor="#64748B"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Currency Code (ISO)</Text>
              <TextInput
                style={styles.input}
                placeholder="USD, NPR, INR, EUR"
                placeholderTextColor="#64748B"
                value={currency}
                onChangeText={setCurrency}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Opening Balance</Text>
              <TextInput
                style={styles.input}
                placeholder="1000.00"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                value={balance}
                onChangeText={setBalance}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateAccount}>
                <Text style={styles.submitText}>Create Account</Text>
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
    marginBottom: 16,
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563EB20",
    alignItems: "center",
    justifyContent: "center",
  },
  titleGroup: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  accountType: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "600",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 12,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#F8FAFC",
    marginTop: 2,
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

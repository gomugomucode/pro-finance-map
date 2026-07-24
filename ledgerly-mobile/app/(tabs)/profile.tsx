import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { getBiometricsEnabled, setBiometricsEnabled, isBiometricsSupported } from "@/lib/biometrics";
import { requestNotificationPermissions } from "@/lib/notifications";
import { Shield, Bell, LogOut, Layers, User as UserIcon, Check } from "lucide-react-native";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [biometricsOn, setBiometricsOn] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [workspace, setWorkspace] = useState("personal");

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        setWorkspace(data.user.user_metadata?.workspace_type || "personal");
      }
    });

    isBiometricsSupported().then(setBiometricsAvailable);
    getBiometricsEnabled().then(setBiometricsOn);
  }, []);

  const handleBiometricsToggle = async (value: boolean) => {
    setBiometricsOn(value);
    await setBiometricsEnabled(value);
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert("Permission Denied", "Notifications were disabled in OS settings.");
        setNotificationsOn(false);
        return;
      }
    }
    setNotificationsOn(value);
  };

  const handleWorkspaceChange = async (ws: string) => {
    setWorkspace(ws);
    await supabase.auth.updateUser({
      data: { workspace_type: ws },
    });
    Alert.alert("Workspace Updated", `Switched to ${ws.toUpperCase()} archetype.`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  const displayName = user?.user_metadata?.display_name || user?.email || "Ledgerly User";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mobile Preferences</Text>
          <Text style={styles.subtitle}>Security, Notifications & Workspace settings</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Workspace Archetype Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Active Workspace Archetype</Text>
          <View style={styles.wsRow}>
            {["personal", "business", "family", "student", "investor"].map((ws) => (
              <TouchableOpacity
                key={ws}
                style={[styles.wsChip, workspace === ws && styles.wsChipActive]}
                onPress={() => handleWorkspaceChange(ws)}
              >
                <Text style={[styles.wsChipText, workspace === ws && styles.wsChipTextActive]}>
                  {ws.charAt(0).toUpperCase() + ws.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security & Biometrics */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Security & Hardware</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <Shield size={20} color="#2563EB" />
              <View>
                <Text style={styles.settingTitle}>Biometric App Lock</Text>
                <Text style={styles.settingSub}>
                  {biometricsAvailable ? "FaceID / TouchID / Passcode" : "Hardware biometrics unavailable"}
                </Text>
              </View>
            </View>
            <Switch
              value={biometricsOn}
              onValueChange={handleBiometricsToggle}
              disabled={!biometricsAvailable}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <Bell size={20} color="#10B981" />
              <View>
                <Text style={styles.settingTitle}>Push Alerts & Notifications</Text>
                <Text style={styles.settingSub}>Budget limits and recurring bill alerts</Text>
              </View>
            </View>
            <Switch value={notificationsOn} onValueChange={handleNotificationToggle} />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out from Mobile</Text>
        </TouchableOpacity>
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
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  subtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  userEmail: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  wsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  wsChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  wsChipActive: {
    backgroundColor: "#2563EB20",
    borderColor: "#2563EB",
  },
  wsChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  wsChipTextActive: {
    color: "#38BDF8",
    fontWeight: "700",
  },
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  settingSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF444415",
    borderWidth: 1,
    borderColor: "#EF444430",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 32,
  },
  signOutText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
});

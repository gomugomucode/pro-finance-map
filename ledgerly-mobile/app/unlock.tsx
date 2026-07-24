import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { authenticateBiometrics } from "@/lib/biometrics";

export default function UnlockScreen() {
  const router = useRouter();

  const handleUnlock = async () => {
    const success = await authenticateBiometrics("Unlock Ledgerly App");
    if (success) {
      router.replace("/(tabs)");
    }
  };

  useEffect(() => {
    handleUnlock();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>L</Text>
      </View>
      <Text style={styles.title}>Ledgerly Mobile OS</Text>
      <Text style={styles.subtitle}>App Locked for Security</Text>

      <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
        <Text style={styles.buttonText}>Unlock with Biometrics</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  subtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
    marginBottom: 32,
  },
  unlockButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

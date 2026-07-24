import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter an email and password.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: name.trim() || email.split("@")[0],
          workspace_type: "personal",
          onboarding_completed: true,
        },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert("Registration Failed", error.message);
    } else {
      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Ledgerly to master your financial evidence</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Anupam Baral"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#64748B"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Register Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  subtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  input: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#F8FAFC",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  linkText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
  },
});

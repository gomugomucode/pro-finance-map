import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getBiometricsEnabled } from "@/lib/biometrics";
import { processOfflineSyncQueue } from "@/lib/offline-sync";
import { View, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // 1. Init Session & Listeners
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkBiometrics(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    // 2. Trigger Offline Queue Sync on startup
    processOfflineSyncQueue().then((res) => {
      if (res.synced > 0) {
        queryClient.invalidateQueries();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkBiometrics = async (currentSession: any) => {
    if (currentSession) {
      const enabled = await getBiometricsEnabled();
      if (enabled) {
        setIsLocked(true);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      if (isLocked) {
        router.replace("/unlock");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [session, isLoading, isLocked, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ color: "#94A3B8", marginTop: 12, fontSize: 13, fontWeight: "600" }}>
          Initializing Ledgerly Mobile OS...
        </Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B0F14" } }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="unlock" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}

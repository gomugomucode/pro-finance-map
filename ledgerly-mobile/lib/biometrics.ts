import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BIOMETRICS_ENABLED_KEY = "ledgerly_biometrics_enabled";

export async function isBiometricsSupported(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function getBiometricsEnabled(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const value = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
  return value === "true";
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  if (Platform.OS === "web") return;
  await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, enabled ? "true" : "false");
}

export async function authenticateBiometrics(promptMessage = "Unlock Ledgerly"): Promise<boolean> {
  if (Platform.OS === "web") return true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: "Use Passcode",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    console.error("Biometrics auth error:", error);
    return false;
  }
}

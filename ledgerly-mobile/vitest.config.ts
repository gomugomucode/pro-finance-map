import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["lib/**/*.{test,spec}.ts", "app/**/*.{test,spec}.ts", "tests/**/*.{test,spec}.ts"],
    server: {
      deps: {
        inline: [/react-native/],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "react-native": path.resolve(__dirname, "./lib/__tests__/mocks/react-native.ts"),
      "expo-secure-store": path.resolve(__dirname, "./lib/__tests__/mocks/expo-secure-store.ts"),
    },
  },
});

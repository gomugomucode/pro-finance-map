import { describe, it, expect, beforeEach } from "vitest";
import {
  queueOfflineMutation,
  getOfflineQueue,
  saveOfflineQueue,
  QueueItem,
} from "../offline-sync";

// Mock localStorage for test environment
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  },
  key: (i: number) => Object.keys(mockStorage)[i] || null,
  length: 0,
};

describe("Mobile Offline Sync & CRUD Queue", () => {
  beforeEach(async () => {
    await saveOfflineQueue([]);
  });

  it("queues an offline transaction mutation with stable ID", async () => {
    const payload = {
      account_id: "acc-123",
      merchant: "Starbucks",
      amount_minor: 450,
      kind: "expense",
      currency: "USD",
      occurred_at: "2026-08-21T10:00:00.000Z",
    };

    await queueOfflineMutation("transactions", "INSERT", payload);

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe("transactions");
    expect(queue[0].action).toBe("INSERT");
    expect(queue[0].payload.merchant).toBe("Starbucks");
    expect(queue[0].payload.id).toBeDefined();
  });

  it("queues account creation mutation with proper schema enum", async () => {
    const payload = {
      name: "Main Wallet",
      type: "wallet",
      currency: "USD",
      opening_balance_minor: 5000,
      current_balance_minor: 5000,
    };

    await queueOfflineMutation("accounts", "INSERT", payload);

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe("accounts");
    expect(queue[0].payload.type).toBe("wallet");
  });

  it("queues account deletion mutation", async () => {
    await queueOfflineMutation("accounts", "DELETE", { id: "acc-to-delete" });

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].action).toBe("DELETE");
    expect(queue[0].payload.id).toBe("acc-to-delete");
  });
});

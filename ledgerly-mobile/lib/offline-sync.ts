import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { supabase } from "./supabase";

export interface QueueItem {
  id: string;
  table: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  payload: any;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = "ledgerly_offline_queue";

export async function getOfflineQueue(): Promise<QueueItem[]> {
  try {
    let raw: string | null = null;
    if (Platform.OS === "web") {
      raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    } else {
      raw = await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY);
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveOfflineQueue(queue: QueueItem[]): Promise<void> {
  const json = JSON.stringify(queue);
  if (Platform.OS === "web") {
    localStorage.setItem(OFFLINE_QUEUE_KEY, json);
  } else {
    await SecureStore.setItemAsync(OFFLINE_QUEUE_KEY, json);
  }
}

export async function queueOfflineMutation(
  table: string,
  action: "INSERT" | "UPDATE" | "DELETE",
  payload: any
): Promise<void> {
  const queue = await getOfflineQueue();
  const itemId = payload.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
  
  // Ensure payload has a stable ID for idempotent database operations
  const payloadWithId = action === "INSERT" && !payload.id ? { ...payload, id: itemId } : payload;

  const item: QueueItem = {
    id: itemId,
    table,
    action,
    payload: payloadWithId,
    timestamp: Date.now(),
  };
  queue.push(item);
  await saveOfflineQueue(queue);
}

export async function processOfflineSyncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const remaining: QueueItem[] = [];
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.action === "INSERT") {
        // Use upsert to prevent duplicate row creation on network retry
        const { error } = await supabase.from(item.table as any).upsert(item.payload, { onConflict: "id" });
        if (error) throw error;
      } else if (item.action === "UPDATE") {
        const { id, ...patch } = item.payload;
        const { error } = await supabase.from(item.table as any).update(patch).eq("id", id);
        if (error) throw error;
      } else if (item.action === "DELETE") {
        const { error } = await supabase.from(item.table as any).delete().eq("id", item.payload.id);
        if (error) throw error;
      }
      synced++;
    } catch (e) {
      console.error(`Offline sync failed for item ${item.id}:`, e);
      failed++;
      remaining.push(item);
    }
  }

  await saveOfflineQueue(remaining);
  return { synced, failed };
}

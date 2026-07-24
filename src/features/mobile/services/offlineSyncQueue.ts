import { SyncQueueItem } from '@/types/sms';
import { supabase } from '@/integrations/supabase/client';

const SYNC_QUEUE_STORAGE_KEY = 'ledgerly_mobile_sync_queue';

export class OfflineSyncQueueManager {
  private queue: SyncQueueItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
        if (raw) this.queue = JSON.parse(raw);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      }
    } catch {
      // Ignore storage errors
    }
  }

  enqueue(action: SyncQueueItem['action'], payload: any): SyncQueueItem {
    const item: SyncQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      payload,
      created_at: Date.now(),
      retry_count: 0,
      status: 'pending',
    };
    this.queue.push(item);
    this.saveToStorage();
    return item;
  }

  getQueue(): SyncQueueItem[] {
    return [...this.queue];
  }

  clearQueue() {
    this.queue = [];
    this.saveToStorage();
  }

  async processSync(): Promise<{ synced: number; failed: number }> {
    if (this.queue.length === 0) return { synced: 0, failed: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Offline: Sync deferred until network is online.');
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    const remainingQueue: SyncQueueItem[] = [];

    for (const item of this.queue) {
      try {
        if (item.action === 'approve_pending') {
          const { error } = await supabase.from('pending_imported_transactions').update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
          }).eq('id', item.payload.id);

          if (error) throw error;
        } else if (item.action === 'dismiss_pending') {
          const { error } = await supabase.from('pending_imported_transactions').update({
            status: 'dismissed',
            reviewed_at: new Date().toISOString(),
          }).eq('id', item.payload.id);

          if (error) throw error;
        }
        synced++;
      } catch (err: any) {
        failed++;
        item.retry_count++;
        item.status = 'failed';
        item.error_msg = err.message || 'Sync error';
        remainingQueue.push(item);
      }
    }

    this.queue = remainingQueue;
    this.saveToStorage();
    return { synced, failed };
  }
}

export const defaultSyncQueue = new OfflineSyncQueueManager();

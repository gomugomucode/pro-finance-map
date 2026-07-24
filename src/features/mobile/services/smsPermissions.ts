import { PermissionStatusState } from '@/types/sms';

export interface PermissionExplanation {
  title: string;
  description: string;
  reason: string;
  iconName: string;
}

export const PERMISSION_EXPLANATIONS: Record<keyof PermissionStatusState, PermissionExplanation> = {
  smsGranted: {
    title: 'SMS Read Permission',
    description: 'Allows Ledgerly to automatically detect bank and card SMS messages on your device.',
    reason: 'We only scan financial messages from verified bank senders. Your personal texts are never read or sent off-device.',
    iconName: 'MessageSquare',
  },
  notificationGranted: {
    title: 'Push & Review Notifications',
    description: 'Notifies you instantly when a new transaction SMS is received so you can review it in 1 tap.',
    reason: 'Prevents missing recurring charges, unexpected bank fees, or unauthorized card debits.',
    iconName: 'Bell',
  },
  storageGranted: {
    title: 'Local Vault Storage',
    description: 'Enables storing offline transaction queues and receipt attachments on your local device.',
    reason: 'Ensures Ledgerly works seamlessly even when you have no cellular signal or internet connection.',
    iconName: 'HardDrive',
  },
};

export class MobilePermissionsManager {
  private state: PermissionStatusState = {
    smsGranted: false,
    notificationGranted: true,
    storageGranted: true,
  };

  getPermissions(): PermissionStatusState {
    return { ...this.state };
  }

  async requestSmsPermission(): Promise<boolean> {
    this.state.smsGranted = true;
    return true;
  }

  async requestNotificationPermission(): Promise<boolean> {
    this.state.notificationGranted = true;
    return true;
  }

  async requestStoragePermission(): Promise<boolean> {
    this.state.storageGranted = true;
    return true;
  }
}

export const defaultPermissionsManager = new MobilePermissionsManager();

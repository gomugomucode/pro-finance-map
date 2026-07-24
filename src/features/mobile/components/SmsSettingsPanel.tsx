import React, { useState } from 'react';
import { useSmsSettings } from '../hooks/useSmsImport';
import { defaultPermissionsManager, PERMISSION_EXPLANATIONS } from '../services/smsPermissions';
import { DEFAULT_PROVIDER_RULES } from '../services/smsProviderRules';
import {
  Smartphone,
  ShieldCheck,
  Bell,
  HardDrive,
  Sliders,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const SmsSettingsPanel: React.FC = () => {
  const { data: settings } = useSmsSettings();
  const [permissions, setPermissions] = useState(defaultPermissionsManager.getPermissions());

  const [enabled, setEnabled] = useState(settings?.sms_import_enabled ?? true);
  const [notify, setNotify] = useState(settings?.auto_notify ?? true);
  const [minConfidence, setMinConfidence] = useState(settings?.min_confidence_threshold ?? 60);
  const [ignoredSenders, setIgnoredSenders] = useState<string[]>(settings?.ignored_senders || ['1001', 'PROMO']);
  const [newSenderInput, setNewSenderInput] = useState('');

  const handleRequestPermission = async (permKey: 'smsGranted' | 'notificationGranted' | 'storageGranted') => {
    if (permKey === 'smsGranted') await defaultPermissionsManager.requestSmsPermission();
    if (permKey === 'notificationGranted') await defaultPermissionsManager.requestNotificationPermission();
    if (permKey === 'storageGranted') await defaultPermissionsManager.requestStoragePermission();

    setPermissions(defaultPermissionsManager.getPermissions());
    toast.success('Permission granted & updated!');
  };

  const handleAddIgnoredSender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSenderInput.trim()) return;
    const clean = newSenderInput.trim().toUpperCase();
    if (!ignoredSenders.includes(clean)) {
      setIgnoredSenders((prev) => [...prev, clean]);
    }
    setNewSenderInput('');
  };

  const handleRemoveIgnoredSender = (sender: string) => {
    setIgnoredSenders((prev) => prev.filter((s) => s !== sender));
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Global Toggle & Confidence Threshold */}
      <Card className="border border-border bg-card shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-foreground">Android SMS Transaction Auto-Capture</h3>
              <p className="text-xs text-muted-foreground">Scan incoming financial SMS and send to review buffer.</p>
            </div>
          </div>

          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <div>
              <span className="font-semibold text-foreground block">Instant Review Notifications</span>
              <span className="text-[11px] text-muted-foreground">Show push alert when bank SMS arrives</span>
            </div>
            <Switch checked={notify} onCheckedChange={setNotify} />
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span>Minimum Match Confidence</span>
              <span className="font-mono text-primary">{minConfidence}%</span>
            </div>
            <Input
              type="range"
              min={30}
              max={95}
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="h-6 cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* Permissions Management */}
      <div className="space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-primary" /> Mobile Device Permissions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {(Object.keys(PERMISSION_EXPLANATIONS) as Array<keyof typeof PERMISSION_EXPLANATIONS>).map((key) => {
            const exp = PERMISSION_EXPLANATIONS[key];
            const isGranted = permissions[key];

            return (
              <Card key={key} className="border border-border bg-card p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{exp.title}</span>
                    {isGranted ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                        Granted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{exp.description}</p>
                  <p className="text-[10px] text-muted-foreground/80 italic">{exp.reason}</p>
                </div>

                {!isGranted && (
                  <Button size="sm" onClick={() => handleRequestPermission(key)} className="w-full text-xs font-semibold mt-2">
                    Grant Permission
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Ignored Senders Management */}
      <Card className="border border-border bg-card p-4 sm:p-5 space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
          Ignored Senders & Marketing Numbers
        </h3>

        <form onSubmit={handleAddIgnoredSender} className="flex gap-2">
          <Input
            placeholder="Sender ID to ignore (e.g., 1001, PROMO)"
            value={newSenderInput}
            onChange={(e) => setNewSenderInput(e.target.value)}
            className="text-xs h-9 flex-1"
          />
          <Button type="submit" size="sm" className="text-xs font-semibold">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Sender
          </Button>
        </form>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {ignoredSenders.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs py-1 px-2.5">
              {s}
              <button onClick={() => handleRemoveIgnoredSender(s)} className="ml-1.5 text-muted-foreground hover:text-foreground">
                ×
              </button>
            </Badge>
          ))}
        </div>
      </Card>

      {/* Provider Rules Inspector */}
      <Card className="border border-border bg-card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Code className="h-4 w-4 text-primary" /> Active Configurable Provider Rules
          </h3>
          <Badge variant="outline" className="text-[10px]">{DEFAULT_PROVIDER_RULES.length} Seeded Rules</Badge>
        </div>

        <div className="space-y-2">
          {DEFAULT_PROVIDER_RULES.map((rule) => (
            <div key={rule.id} className="p-2.5 rounded-lg bg-muted/30 border border-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-foreground">{rule.provider_name}</span>
                <span className="ml-2 font-mono text-[10px] text-muted-foreground">Sender: {rule.sender_pattern}</span>
                <p className="font-mono text-[11px] text-muted-foreground truncate mt-0.5 max-w-lg">
                  Regex: {rule.body_regex}
                </p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] shrink-0 self-start sm:self-auto">
                Active
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

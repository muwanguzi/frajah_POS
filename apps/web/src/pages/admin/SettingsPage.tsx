import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { settingsService } from '@/services/settings.service';

interface Setting {
  key: string;
  value: unknown;
}

// Flat map of key -> value derived from API response
type SettingsMap = Record<string, unknown>;

function normalizeSettings(raw: unknown): SettingsMap {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    return Object.fromEntries((raw as Setting[]).map((s) => [s.key, s.value]));
  }
  if (typeof raw === 'object') return raw as SettingsMap;
  return {};
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b last:border-0">
      <div className="flex-1 pr-8">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: rawSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.findAll(),
    retry: false,
  });

  const [values, setValues] = useState<SettingsMap>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (rawSettings) {
      setValues(normalizeSettings(rawSettings));
      setDirty(new Set());
    }
  }, [rawSettings]);

  const saveMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      await Promise.all(keys.map((key) => settingsService.set(key, values[key])));
    },
    onSuccess: () => {
      toast.success('Settings saved');
      setDirty(new Set());
    },
    onError: () => toast.error('Failed to save settings'),
  });

  function set(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
  }

  function get(key: string, fallback: unknown = ''): unknown {
    return values[key] !== undefined ? values[key] : fallback;
  }

  function saveTab(keys: string[]) {
    const changedKeys = keys.filter((k) => dirty.has(k));
    if (changedKeys.length === 0) {
      toast('No changes to save', { icon: 'ℹ️' });
      return;
    }
    saveMutation.mutate(changedKeys);
  }

  const isSaving = saveMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading settings...
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="System Settings" subtitle="Configure your POS system preferences" />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pos">POS</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic business information and regional settings</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow label="Business Name" description="Your company's trading name">
                <Input
                  className="w-64"
                  value={String(get('business_name', 'Franjah Shop'))}
                  onChange={(e) => set('business_name', e.target.value)}
                />
              </SettingRow>
              <SettingRow label="Currency" description="Operating currency (fixed to UGX)">
                <Input className="w-64" value="UGX — Ugandan Shilling" readOnly disabled />
              </SettingRow>
              <SettingRow
                label="VAT Rate (%)"
                description="Default VAT percentage applied on sales"
              >
                <Input
                  className="w-32 text-right"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={String(get('vat_rate', 18))}
                  onChange={(e) => set('vat_rate', parseFloat(e.target.value))}
                />
              </SettingRow>
              <SettingRow
                label="Fiscal Year Start"
                description="The month your financial year begins (1–12)"
              >
                <Input
                  className="w-32 text-right"
                  type="number"
                  min={1}
                  max={12}
                  value={String(get('fiscal_year_start', 1))}
                  onChange={(e) => set('fiscal_year_start', parseInt(e.target.value))}
                />
              </SettingRow>
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() =>
                    saveTab(['business_name', 'vat_rate', 'fiscal_year_start'])
                  }
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save General
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── POS ── */}
        <TabsContent value="pos">
          <Card>
            <CardHeader>
              <CardTitle>POS Settings</CardTitle>
              <CardDescription>Point-of-sale terminal behaviour and receipt configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow label="Receipt Prefix" description="Prefix added to all receipt numbers">
                <Input
                  className="w-40"
                  value={String(get('receipt_prefix', 'FRJ'))}
                  onChange={(e) => set('receipt_prefix', e.target.value)}
                  maxLength={10}
                />
              </SettingRow>
              <SettingRow label="Tax Rate (%)" description="Default tax rate applied at POS">
                <Input
                  className="w-32 text-right"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={String(get('pos_tax_rate', 18))}
                  onChange={(e) => set('pos_tax_rate', parseFloat(e.target.value))}
                />
              </SettingRow>
              <SettingRow
                label="Print Receipt Automatically"
                description="Send receipt to printer immediately after a sale completes"
              >
                <Switch
                  checked={Boolean(get('pos_auto_print_receipt', false))}
                  onCheckedChange={(v) => set('pos_auto_print_receipt', v)}
                />
              </SettingRow>
              <SettingRow
                label="Require Customer for Sale"
                description="Cashier must select or create a customer before completing a sale"
              >
                <Switch
                  checked={Boolean(get('pos_require_customer', false))}
                  onCheckedChange={(v) => set('pos_require_customer', v)}
                />
              </SettingRow>
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() =>
                    saveTab([
                      'receipt_prefix',
                      'pos_tax_rate',
                      'pos_auto_print_receipt',
                      'pos_require_customer',
                    ])
                  }
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save POS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Inventory ── */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
              <CardDescription>Stock valuation and replenishment controls</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow
                label="Costing Method"
                description="How inventory cost is calculated when stock is consumed"
              >
                <Select
                  value={String(get('costing_method', 'FIFO'))}
                  onValueChange={(v) => set('costing_method', v)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO</SelectItem>
                    <SelectItem value="LIFO">LIFO</SelectItem>
                    <SelectItem value="WAC">WAC (Weighted Avg)</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow
                label="Low Stock Alert Threshold"
                description="Global default for minimum stock quantity before an alert fires"
              >
                <Input
                  className="w-32 text-right"
                  type="number"
                  min={0}
                  value={String(get('low_stock_threshold', 10))}
                  onChange={(e) => set('low_stock_threshold', parseInt(e.target.value))}
                />
              </SettingRow>
              <SettingRow
                label="Auto-Reorder Enabled"
                description="Automatically create purchase orders when stock falls below threshold"
              >
                <Switch
                  checked={Boolean(get('auto_reorder_enabled', false))}
                  onCheckedChange={(v) => set('auto_reorder_enabled', v)}
                />
              </SettingRow>
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() =>
                    saveTab([
                      'costing_method',
                      'low_stock_threshold',
                      'auto_reorder_enabled',
                    ])
                  }
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Inventory
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Control how and when the system notifies your team</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow
                label="Email Notifications"
                description="Send system alerts and reports via email"
              >
                <Switch
                  checked={Boolean(get('notify_email', true))}
                  onCheckedChange={(v) => set('notify_email', v)}
                />
              </SettingRow>
              <SettingRow
                label="SMS Notifications"
                description="Send critical alerts via SMS (requires SMS gateway configuration)"
              >
                <Switch
                  checked={Boolean(get('notify_sms', false))}
                  onCheckedChange={(v) => set('notify_sms', v)}
                />
              </SettingRow>
              <SettingRow
                label="Stock Alerts"
                description="Notify managers when stock falls below the low-stock threshold"
              >
                <Switch
                  checked={Boolean(get('notify_stock_alerts', true))}
                  onCheckedChange={(v) => set('notify_stock_alerts', v)}
                />
              </SettingRow>
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() =>
                    saveTab(['notify_email', 'notify_sms', 'notify_stock_alerts'])
                  }
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

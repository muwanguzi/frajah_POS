import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { CalendarDays, ShoppingCart, TrendingUp, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { posService } from '@/services/pos.service';
import { formatUGX } from '@/lib/currency';

interface SaleItem {
  id: string;
  quantity: number;
}

interface Sale {
  id: string;
  receiptNumber: string;
  customer?: { id: string; name: string };
  session?: { cashier?: { id: string; firstName: string; lastName: string } };
  items: SaleItem[];
  payments?: { method: string; amount: string }[];
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  status?: string;
  createdAt: string;
}

type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'custom';

function getPresetDates(preset: DateRangePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  if (preset === 'today') {
    const today = fmt(now);
    return { startDate: today, endDate: today };
  }
  if (preset === 'this_week') {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    return { startDate: fmt(monday), endDate: fmt(now) };
  }
  if (preset === 'this_month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: fmt(first), endDate: fmt(now) };
  }
  return { startDate: fmt(now), endDate: fmt(now) };
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

function SummaryCard({ icon, label, value, sub }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-lg border p-5 flex items-start gap-4">
      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  MOBILE_MONEY: 'Mobile Money',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT: 'Credit',
};

export default function SalesPage() {
  const [preset, setPreset] = useState<DateRangePreset>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { startDate, endDate } = useMemo(() => {
    if (preset === 'custom') {
      return { startDate: customStart, endDate: customEnd };
    }
    return getPresetDates(preset);
  }, [preset, customStart, customEnd]);

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ['sales', startDate, endDate],
    queryFn: () =>
      posService.getSales({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }) as Promise<Sale[]>,
    retry: false,
    enabled: preset !== 'custom' || (!!customStart && !!customEnd),
  });

  // Summary computations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = useMemo(
    () => sales.filter((s) => s.createdAt?.startsWith(todayStr)),
    [sales, todayStr]
  );
  const todayTotal = useMemo(
    () => todaySales.reduce((sum, s) => sum + Number(s.total ?? 0), 0),
    [todaySales]
  );
  const periodTotal = useMemo(
    () => sales.reduce((sum, s) => sum + Number(s.total ?? 0), 0),
    [sales]
  );
  const avgOrderValue = sales.length > 0 ? periodTotal / sales.length : 0;

  const columns: ColumnDef<Sale>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt #',
      cell: ({ row }) => (
        <span className="text-sm font-mono font-medium text-blue-600">
          {row.original.receiptNumber}
        </span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.customer?.name ?? <span className="text-gray-400 italic">Walk-in</span>}
        </span>
      ),
    },
    {
      accessorKey: 'session',
      header: 'Cashier',
      cell: ({ row }) => {
        const c = row.original.session?.cashier;
        return (
          <span className="text-sm text-gray-600">
            {c ? `${c.firstName} ${c.lastName}` : '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 font-medium">
          {row.original.items?.length ?? 0}
        </span>
      ),
    },
    {
      accessorKey: 'subtotal',
      header: 'Subtotal',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-gray-700">
          {formatUGX(Number(row.original.subtotal))}
        </span>
      ),
    },
    {
      accessorKey: 'discountAmount',
      header: 'Discount',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-orange-600">
          {Number(row.original.discountAmount) > 0
            ? `- ${formatUGX(Number(row.original.discountAmount))}`
            : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'taxAmount',
      header: 'Tax',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-gray-500">
          {formatUGX(Number(row.original.taxAmount))}
        </span>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="text-sm font-mono font-semibold text-gray-900">
          {formatUGX(Number(row.original.total ?? 0))}
        </span>
      ),
    },
    {
      accessorKey: 'payments',
      header: 'Payment',
      cell: ({ row }) => {
        const method = row.original.payments?.[0]?.method;
        return (
          <span className="text-sm text-gray-600">
            {method ? (PAYMENT_METHOD_LABELS[method] ?? method) : '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status || 'COMPLETED'} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleString('en-UG', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </span>
      ),
    },
  ];

  const toolbar = (
    <div className="flex items-center gap-3 flex-wrap">
      <Select value={preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="this_week">This Week</SelectItem>
          <SelectItem value="this_month">This Month</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>
      {preset === 'custom' && (
        <>
          <Input
            type="date"
            className="w-40"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
          />
          <span className="text-gray-400 text-sm">to</span>
          <Input
            type="date"
            className="w-40"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
          />
        </>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="POS transaction history"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Today's Sales"
          value={formatUGX(todayTotal)}
          sub={`${todaySales.length} transactions today`}
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Period Total"
          value={formatUGX(periodTotal)}
          sub={`${sales.length} transactions`}
        />
        <SummaryCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Transaction Count"
          value={String(sales.length)}
          sub="in selected period"
        />
        <SummaryCard
          icon={<Receipt className="h-5 w-5" />}
          label="Avg. Order Value"
          value={formatUGX(avgOrderValue)}
          sub="per transaction"
        />
      </div>

      <DataTable
        data={sales}
        columns={columns}
        isLoading={isLoading}
        toolbar={toolbar}
      />
    </div>
  );
}

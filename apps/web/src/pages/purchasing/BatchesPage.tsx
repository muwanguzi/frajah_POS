import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SearchInput } from '@/components/shared/SearchInput';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { inventoryService } from '@/services/inventory.service';
import { formatUGX } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface Batch {
  id: string;
  batchNumber: string;
  product?: { id: string; name: string; sku?: string } | null;
  branch?: { id: string; name: string } | null;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number;
  costingMethod: string;
  expiryDate?: string | null;
  receivedAt: string;
  status?: string;
}

const COSTING_METHODS = [
  { value: 'all', label: 'All Methods' },
  { value: 'FIFO', label: 'FIFO' },
  { value: 'LIFO', label: 'LIFO' },
  { value: 'WAC', label: 'WAC (Weighted Avg)' },
];

const COSTING_BADGE_CLASSES: Record<string, string> = {
  FIFO: 'bg-blue-100 text-blue-800 border-blue-200',
  LIFO: 'bg-purple-100 text-purple-800 border-purple-200',
  WAC: 'bg-teal-100 text-teal-800 border-teal-200',
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-UG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isExpired(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isExpiringWithin30Days(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(now.getDate() + 30);
  return expiry >= now && expiry <= thirtyDays;
}

export default function BatchesPage() {
  const [costingMethod, setCostingMethod] = useState('all');
  const [search, setSearch] = useState('');

  const { data: batches = [], isLoading } = useQuery<Batch[]>({
    queryKey: ['batches', costingMethod],
    queryFn: () =>
      inventoryService.getBatches(
        costingMethod && costingMethod !== 'all'
          ? { costingMethod }
          : undefined
      ) as Promise<Batch[]>,
    retry: false,
  });

  const handleSearch = useCallback((val: string) => setSearch(val), []);

  const filteredBatches = search
    ? batches.filter(
        (b) =>
          b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
          b.product?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : batches;

  const columns: ColumnDef<Batch>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      accessorKey: 'batchNumber',
      header: 'Batch Number',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm text-gray-800">
          {row.original.batchNumber}
        </span>
      ),
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm text-gray-900">
            {row.original.product?.name || <span className="text-gray-400">—</span>}
          </p>
          {row.original.product?.sku && (
            <p className="text-xs text-gray-400">{row.original.product.sku}</p>
          )}
        </div>
      ),
    },
    {
      id: 'branch',
      header: 'Branch',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.branch?.name || <span className="text-gray-400">—</span>}
        </span>
      ),
    },
    {
      id: 'quantityReceived',
      header: 'Qty Received',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-gray-700">
          {row.original.quantityReceived}
        </span>
      ),
    },
    {
      id: 'quantityRemaining',
      header: 'Qty Remaining',
      cell: ({ row }) => {
        const remaining = row.original.quantityRemaining;
        const isDepleted = remaining === 0;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-sm font-semibold',
                isDepleted ? 'text-red-600' : 'text-gray-700'
              )}
            >
              {remaining}
            </span>
            {isDepleted && (
              <Badge
                variant="outline"
                className="text-xs bg-red-50 text-red-700 border-red-200 py-0"
              >
                Depleted
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'unitCost',
      header: 'Unit Cost',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-gray-800">
          {formatUGX(row.original.unitCost ?? 0)}
        </span>
      ),
    },
    {
      id: 'costingMethod',
      header: 'Method',
      cell: ({ row }) => {
        const method = row.original.costingMethod;
        return (
          <Badge
            variant="outline"
            className={cn(
              'font-semibold text-xs',
              COSTING_BADGE_CLASSES[method] || 'bg-gray-100 text-gray-700 border-gray-200'
            )}
          >
            {method}
          </Badge>
        );
      },
    },
    {
      id: 'expiryDate',
      header: 'Expiry Date',
      cell: ({ row }) => {
        const { expiryDate } = row.original;
        if (!expiryDate) {
          return <span className="text-sm text-gray-400">N/A</span>;
        }
        const expired = isExpired(expiryDate);
        const expiring = isExpiringWithin30Days(expiryDate);
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-sm',
                expired ? 'text-red-600 font-semibold' : expiring ? 'text-amber-600 font-medium' : 'text-gray-600'
              )}
            >
              {formatDate(expiryDate)}
            </span>
            {expired && (
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            )}
            {!expired && expiring && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const remaining = row.original.quantityRemaining;
        const status = row.original.status || (remaining === 0 ? 'DEPLETED' : 'ACTIVE');
        return <StatusBadge status={status === 'DEPLETED' ? 'INACTIVE' : 'ACTIVE'} />;
      },
    },
    {
      id: 'receivedAt',
      header: 'Received At',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{formatDate(row.original.receivedAt)}</span>
      ),
    },
  ];

  const toolbar = (
    <div className="flex items-center gap-3 w-full">
      <SearchInput
        placeholder="Search by batch number or product..."
        onSearch={handleSearch}
        className="w-72"
      />
      <Select value={costingMethod} onValueChange={setCostingMethod}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Methods" />
        </SelectTrigger>
        <SelectContent>
          {COSTING_METHODS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="ml-auto text-sm text-gray-500">
        {filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''}
      </span>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Product Batches"
        subtitle="Track inventory batches by FIFO / LIFO / WAC"
        actions={
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Package className="h-4 w-4" />
            <span>{filteredBatches.length} batches</span>
          </div>
        }
      />

      <DataTable
        data={filteredBatches}
        columns={columns}
        isLoading={isLoading}
        toolbar={toolbar}
      />
    </div>
  );
}

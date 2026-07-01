import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, CalendarDays } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SearchInput } from '@/components/shared/SearchInput';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { purchasingService } from '@/services/purchasing.service';
import { formatUGX } from '@/lib/currency';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
  status: string;
  expectedDate?: string | null;
  total: string | number;
  createdAt: string;
}

const PO_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-UG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Map PARTIALLY_RECEIVED to PARTIAL for StatusBadge (which already has PARTIAL config)
function normalisedStatus(status: string): string {
  if (status === 'PARTIALLY_RECEIVED') return 'PARTIAL';
  return status;
}

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const { data: orders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', status],
    queryFn: () =>
      purchasingService.getPurchaseOrders(
        status && status !== 'all' ? { status } : undefined
      ) as Promise<PurchaseOrder[]>,
    retry: false,
  });

  const handleSearch = useCallback((val: string) => setSearch(val), []);

  const filteredOrders = search
    ? orders.filter(
        (o) =>
          o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.supplier?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      accessorKey: 'poNumber',
      header: 'PO Number',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm text-blue-700">
          {row.original.poNumber}
        </span>
      ),
    },
    {
      id: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.supplier?.name || <span className="text-gray-400">—</span>}
        </span>
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={normalisedStatus(row.original.status)} />
      ),
    },
    {
      id: 'expectedDate',
      header: 'Expected Date',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 flex items-center gap-1">
          {row.original.expectedDate ? (
            <>
              <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
              {formatDate(row.original.expectedDate)}
            </>
          ) : (
            <span className="text-gray-400">—</span>
          )}
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
      id: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-blue-600"
          onClick={() => navigate(`/purchasing/orders/${row.original.id}`)}
          title="View details"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3 w-full">
      <SearchInput
        placeholder="Search by PO number or supplier..."
        onSearch={handleSearch}
        className="w-72"
      />
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          {PO_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="ml-auto text-sm text-gray-500">
        {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
      </span>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage supplier purchase orders"
        actions={
          <Button onClick={() => navigate('/purchasing/orders/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        }
      />

      <DataTable
        data={filteredOrders}
        columns={columns}
        isLoading={isLoading}
        toolbar={toolbar}
      />
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Eye } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatUGX } from '@/lib/currency';
import apiClient from '@/lib/api-client';

interface SaleOrder {
  id: string;
  orderNumber?: string;
  customer?: { id: string; name: string };
  status: string;
  total?: string | number;
  createdAt: string;
}

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery<SaleOrder[]>({
    queryKey: ['sale-orders'],
    queryFn: () => apiClient.get('/sales/orders') as Promise<SaleOrder[]>,
    retry: false,
  });

  const columns: ColumnDef<SaleOrder>[] = [
    { header: '#', cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>, size: 40 },
    {
      header: 'Order #',
      cell: ({ row }) => <span className="font-mono text-sm text-blue-600">{row.original.orderNumber || row.original.id.slice(0, 8)}</span>,
    },
    {
      header: 'Customer',
      cell: ({ row }) => <span className="text-sm">{row.original.customer?.name || 'Walk-in'}</span>,
    },
    {
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: 'Total',
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatUGX(Number(row.original.total ?? 0))}</span>,
    },
    {
      header: 'Date',
      cell: ({ row }) => <span className="text-xs text-gray-400">{new Date(row.original.createdAt).toLocaleDateString('en-UG')}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        subtitle="Manage customer orders and fulfilment"
        actions={
          <Button className="gap-1.5"><Plus className="h-4 w-4" /> New Order</Button>
        }
      />
      <DataTable data={orders} columns={columns} isLoading={isLoading} />
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Truck, Eye, Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';

interface DeliveryNote {
  id: string;
  noteNumber: string;
  customer?: { id: string; name: string };
  status: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  createdAt: string;
}

export default function DeliveryNotesPage() {
  const { data: notes = [], isLoading } = useQuery<DeliveryNote[]>({
    queryKey: ['delivery-notes'],
    queryFn: () => apiClient.get('/sales/delivery-notes') as Promise<DeliveryNote[]>,
    retry: false,
  });

  const columns: ColumnDef<DeliveryNote>[] = [
    { header: '#', cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>, size: 40 },
    {
      header: 'Note #',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-blue-600 font-medium">{row.original.noteNumber}</span>
      ),
    },
    {
      header: 'Customer',
      cell: ({ row }) => <span className="text-sm">{row.original.customer?.name || '—'}</span>,
    },
    {
      header: 'Delivery Address',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 max-w-xs truncate block">{row.original.deliveryAddress || '—'}</span>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: 'Delivery Date',
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">
          {row.original.deliveryDate ? new Date(row.original.deliveryDate).toLocaleDateString('en-UG') : '—'}
        </span>
      ),
    },
    {
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">{new Date(row.original.createdAt).toLocaleDateString('en-UG')}</span>
      ),
    },
    {
      id: 'actions',
      cell: () => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Delivery Notes"
        subtitle="Track goods dispatched to customers"
        actions={
          <Button className="gap-1.5"><Plus className="h-4 w-4" /> New Delivery Note</Button>
        }
      />
      <DataTable data={notes} columns={columns} isLoading={isLoading} />
    </div>
  );
}

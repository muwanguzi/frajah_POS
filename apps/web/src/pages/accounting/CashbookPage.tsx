import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatUGX } from '@/lib/currency';
import apiClient from '@/lib/api-client';

interface CashbookEntry {
  id: string;
  type: 'INFLOW' | 'OUTFLOW';
  amount: string | number;
  description: string;
  reference?: string;
  createdAt: string;
}

export default function CashbookPage() {
  const { data: entries = [], isLoading } = useQuery<CashbookEntry[]>({
    queryKey: ['cashbook'],
    queryFn: () => apiClient.get('/accounting/cashbook') as Promise<CashbookEntry[]>,
    retry: false,
  });

  const columns: ColumnDef<CashbookEntry>[] = [
    {
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {new Date(row.original.createdAt).toLocaleDateString('en-UG')}
        </span>
      ),
    },
    {
      header: 'Type',
      cell: ({ row }) => (
        <Badge className={row.original.type === 'INFLOW' ? 'bg-green-100 text-green-700 border-0' : 'bg-red-100 text-red-700 border-0'}>
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span className="text-sm">{row.original.description}</span>,
    },
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-400">{row.original.reference || '—'}</span>
      ),
    },
    {
      header: 'Amount (UGX)',
      cell: ({ row }) => {
        const isInflow = row.original.type === 'INFLOW';
        return (
          <span className={`font-mono font-semibold ${isInflow ? 'text-green-600' : 'text-red-600'}`}>
            {isInflow ? '+' : '-'}{formatUGX(Number(row.original.amount))}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Cashbook" subtitle="Cash inflows and outflows" />
      <DataTable data={entries} columns={columns} isLoading={isLoading} />
    </div>
  );
}

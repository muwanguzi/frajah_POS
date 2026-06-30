import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatUGX } from '@/lib/currency';
import apiClient from '@/lib/api-client';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance?: number;
  isActive: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  ASSET: 'bg-blue-100 text-blue-700',
  LIABILITY: 'bg-red-100 text-red-700',
  EQUITY: 'bg-purple-100 text-purple-700',
  REVENUE: 'bg-green-100 text-green-700',
  EXPENSE: 'bg-orange-100 text-orange-700',
};

export default function GeneralLedgerPage() {
  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => apiClient.get('/accounting/accounts') as Promise<Account[]>,
    retry: false,
  });

  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold text-blue-600">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Account Name',
      cell: ({ row }) => <span className="font-medium text-sm">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const t = row.original.type;
        return <Badge className={`${TYPE_COLORS[t] || 'bg-gray-100 text-gray-700'} border-0 text-xs`}>{t}</Badge>;
      },
    },
    {
      header: 'Balance (UGX)',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{formatUGX(row.original.balance ?? 0)}</span>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'} className="text-xs">
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="General Ledger"
        subtitle="Chart of accounts and balances"
      />
      <DataTable data={accounts} columns={columns} isLoading={isLoading} />
    </div>
  );
}

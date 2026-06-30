import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatUGX } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { expensesService } from '@/services/expenses.service';

interface Expense {
  id: string;
  description: string;
  amount: string | number;
  category?: { id: string; name: string };
  branch?: { id: string; name: string };
  submittedBy?: { id: string; fullName: string };
  status: string;
  receiptUrl?: string;
  date?: string;
  createdAt: string;
}

export default function ExpenseApprovalPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses-pending'],
    queryFn: () => expensesService.getExpenses({ status: 'PENDING' }) as Promise<Expense[]>,
    retry: false,
  });

  const approve = useMutation({
    mutationFn: (id: string) => expensesService.approveExpense(id),
    onSuccess: () => {
      toast({ title: 'Expense approved' });
      queryClient.invalidateQueries({ queryKey: ['expenses-pending'] });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to approve', variant: 'destructive' });
    },
  });

  const reject = useMutation({
    mutationFn: ({ id }: { id: string; reason: string }) => expensesService.rejectExpense(id),
    onSuccess: () => {
      toast({ title: 'Expense rejected' });
      queryClient.invalidateQueries({ queryKey: ['expenses-pending'] });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to reject', variant: 'destructive' });
    },
  });

  const columns: ColumnDef<Expense>[] = [
    { header: '#', cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>, size: 40 },
    {
      header: 'Description',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.description}</span>,
    },
    {
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.category?.name || '—'}</span>
      ),
    },
    {
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold">{formatUGX(Number(row.original.amount ?? 0))}</span>
      ),
    },
    {
      header: 'Submitted By',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.submittedBy?.fullName || '—'}</span>
      ),
    },
    {
      header: 'Branch',
      cell: ({ row }) => <span className="text-sm text-gray-500">{row.original.branch?.name || '—'}</span>,
    },
    {
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">
          {row.original.date
            ? new Date(row.original.date).toLocaleDateString('en-UG')
            : new Date(row.original.createdAt).toLocaleDateString('en-UG')}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const exp = row.original;
        if (exp.status !== 'PENDING') return null;
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-50"
              onClick={() => approve.mutate(exp.id)}
              disabled={approve.isPending}
              title="Approve"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50"
              onClick={() => reject.mutate({ id: exp.id, reason: 'Rejected by manager' })}
              disabled={reject.isPending}
              title="Reject"
            >
              <XCircle className="h-4 w-4" />
            </Button>
            {exp.receiptUrl && (
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => window.open(exp.receiptUrl, '_blank')}
                title="View receipt"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Expense Approvals"
        subtitle={`${expenses.length} pending expense${expenses.length !== 1 ? 's' : ''} awaiting approval`}
      />
      <DataTable data={expenses} columns={columns} isLoading={isLoading} />
    </div>
  );
}

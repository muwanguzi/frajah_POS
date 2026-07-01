import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { expensesService } from '@/services/expenses.service';
import { formatUGX } from '@/lib/currency';

interface ExpenseCategory {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  description: string;
  category?: { id: string; name: string };
  categoryId?: string;
  amount: number;
  date: string;
  branch?: { id: string; name: string };
  branchId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUBMITTED';
  receiptUrl?: string;
  notes?: string;
  submittedBy?: { id: string; firstName: string; lastName: string };
}

interface ExpenseFormState {
  description: string;
  categoryId: string;
  amount: string;
  date: string;
  receiptUrl: string;
  notes: string;
}

const emptyForm = (): ExpenseFormState => ({
  description: '',
  categoryId: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  receiptUrl: '',
  notes: '',
});

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function ExpensesPage() {
  const queryClient = useQueryClient();

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [approveExpense, setApproveExpense] = useState<Expense | null>(null);
  const [rejectExpense, setRejectExpense] = useState<Expense | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState<ExpenseFormState>(emptyForm());

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', statusFilter],
    queryFn: () =>
      expensesService.getExpenses({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }) as Promise<Expense[]>,
    retry: false,
  });

  const { data: categories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ['expense-categories'],
    queryFn: () => expensesService.getCategories() as Promise<ExpenseCategory[]>,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => expensesService.createExpense(data),
    onSuccess: () => {
      toast.success('Expense added successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setNewDialogOpen(false);
      setForm(emptyForm());
    },
    onError: () => toast.error('Failed to add expense'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => expensesService.approveExpense(id),
    onSuccess: () => {
      toast.success('Expense approved');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setApproveExpense(null);
    },
    onError: () => toast.error('Failed to approve expense'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      expensesService.rejectExpense(id, reason),
    onSuccess: () => {
      toast.success('Expense rejected');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setRejectExpense(null);
      setRejectReason('');
    },
    onError: () => toast.error('Failed to reject expense'),
  });

  function handleCreate() {
    const parsedAmount = parseFloat(form.amount);
    if (!form.description || !form.amount || isNaN(parsedAmount)) {
      toast.error('Description and amount are required');
      return;
    }
    createMutation.mutate({
      description: form.description,
      categoryId: form.categoryId || undefined,
      amount: parsedAmount,
      date: form.date,
      receiptUrl: form.receiptUrl || undefined,
      notes: form.notes || undefined,
    });
  }

  const columns: ColumnDef<Expense>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.description}</p>
          {row.original.notes && (
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{row.original.notes}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.category?.name ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="text-sm font-mono font-semibold text-gray-900">
          {formatUGX(row.original.amount ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.date
            ? new Date(row.original.date).toLocaleDateString('en-UG', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'branch',
      header: 'Branch',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.branch?.name ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'submittedBy',
      header: 'Submitted By',
      cell: ({ row }) => {
        const sb = row.original.submittedBy;
        return (
          <span className="text-sm text-gray-600">
            {sb ? `${sb.firstName} ${sb.lastName}` : '—'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const status = row.original.status;
        const canAct = status === 'PENDING' || status === 'SUBMITTED';
        if (!canAct) return null;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => setApproveExpense(row.original)}
              title="Approve"
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => {
                setRejectReason('');
                setRejectExpense(row.original);
              }}
              title="Reject"
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`${expenses.length} expenses`}
        actions={
          <Button
            onClick={() => {
              setForm(emptyForm());
              setNewDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        }
      />

      <DataTable data={expenses} columns={columns} isLoading={isLoading} toolbar={toolbar} />

      {/* Add Expense Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="exp-desc">Description</Label>
              <Input
                id="exp-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Office supplies, transport, etc."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-cat">Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger id="exp-cat">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount (UGX)</Label>
              <Input
                id="exp-amount"
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-receipt">Receipt URL</Label>
              <Input
                id="exp-receipt"
                value={form.receiptUrl}
                onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="exp-notes">Notes</Label>
              <Input
                id="exp-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <ConfirmDialog
        open={!!approveExpense}
        onOpenChange={(open) => !open && setApproveExpense(null)}
        title="Approve Expense"
        description={`Approve expense "${approveExpense?.description}" for ${formatUGX(approveExpense?.amount ?? 0)}?`}
        confirmLabel="Approve"
        variant="default"
        onConfirm={() => approveExpense && approveMutation.mutate(approveExpense.id)}
        isLoading={approveMutation.isPending}
      />

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectExpense}
        onOpenChange={(open) => {
          if (!open) {
            setRejectExpense(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <p className="text-sm text-gray-600">
              Rejecting: <strong>{rejectExpense?.description}</strong> (
              {formatUGX(rejectExpense?.amount ?? 0)})
            </p>
            <Label htmlFor="reject-reason">Reason for rejection</Label>
            <Input
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Insufficient justification, duplicate, etc."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectExpense(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectExpense &&
                rejectMutation.mutate({ id: rejectExpense.id, reason: rejectReason })
              }
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

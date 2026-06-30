import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, ClipboardList, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

interface Branch { id: string; name: string }

interface StockCount {
  id: string;
  countNumber?: string;
  branch?: { id: string; name: string };
  status: string;
  itemsCount?: number;
  variance?: number;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

const emptyForm = { branchId: '', notes: '' };

export default function StockCountPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: counts = [], isLoading } = useQuery<StockCount[]>({
    queryKey: ['stock-counts'],
    queryFn: () => apiClient.get('/inventory/stock-counts') as Promise<StockCount[]>,
    retry: false,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/branches') as Promise<Branch[]>,
    retry: false,
  });

  const createCount = useMutation({
    mutationFn: (data: typeof form) => apiClient.post('/inventory/stock-counts', data),
    onSuccess: () => {
      toast({ title: 'Stock count created' });
      queryClient.invalidateQueries({ queryKey: ['stock-counts'] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to create stock count', variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    if (!form.branchId) {
      toast({ title: 'Validation', description: 'Please select a branch', variant: 'destructive' });
      return;
    }
    createCount.mutate(form);
  };

  const columns: ColumnDef<StockCount>[] = [
    { header: '#', cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>, size: 40 },
    {
      header: 'Count #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-blue-600">{row.original.countNumber || row.original.id.slice(0, 8)}</span>
      ),
    },
    {
      header: 'Branch',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.branch?.name || '—'}</span>,
    },
    {
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: 'Items',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.itemsCount ?? '—'}</span>,
    },
    {
      header: 'Variance',
      cell: ({ row }) => {
        const v = row.original.variance ?? 0;
        return (
          <span className={`font-mono text-sm font-medium ${v < 0 ? 'text-red-600' : v > 0 ? 'text-green-600' : 'text-gray-500'}`}>
            {v > 0 ? '+' : ''}{v}
          </span>
        );
      },
    },
    {
      header: 'Started',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">
          {row.original.startedAt ? new Date(row.original.startedAt).toLocaleDateString('en-UG') : '—'}
        </span>
      ),
    },
    {
      header: 'Completed',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">
          {row.original.completedAt ? new Date(row.original.completedAt).toLocaleDateString('en-UG') : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        row.original.status === 'PENDING' || row.original.status === 'IN_PROGRESS' ? (
          <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
            <CheckCircle className="h-3 w-3" /> Complete
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Count"
        subtitle="Conduct physical inventory counts and reconcile variances"
        actions={
          <Button className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Start Count
          </Button>
        }
      />

      <DataTable data={counts} columns={columns} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Start Stock Count
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Branch *</Label>
              <Select value={form.branchId} onValueChange={v => setForm(f => ({ ...f, branchId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select branch to count" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(branches) ? branches : []).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes for this count"
              />
            </div>
            <p className="text-xs text-gray-500">
              Starting a stock count will create a count sheet with all products in the selected branch.
              You can then enter physical counts for each item.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createCount.isPending}>
              {createCount.isPending ? 'Creating...' : 'Start Count'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

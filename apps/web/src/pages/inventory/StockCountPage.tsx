import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, ClipboardList, ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { inventoryService } from '@/services/inventory.service';
import apiClient from '@/lib/api-client';

interface Branch { id: string; name: string }

interface StockCount {
  id: string;
  countNumber?: string;
  branch?: { id: string; name: string };
  status: string;
  items?: unknown[];
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

const emptyForm = { branchId: '', notes: '' };

export default function StockCountPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: countsRes, isLoading } = useQuery({
    queryKey: ['stock-counts'],
    queryFn: () => inventoryService.getStockCounts({ limit: 100 }) as Promise<{ data: StockCount[]; total: number } | StockCount[]>,
    retry: false,
  });
  const counts: StockCount[] = Array.isArray(countsRes)
    ? countsRes
    : (countsRes as { data: StockCount[] } | undefined)?.data ?? [];

  const { data: branchesRes = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/branches') as Promise<Branch[] | { data: Branch[] }>,
    retry: false,
  });
  const branches: Branch[] = Array.isArray(branchesRes)
    ? branchesRes
    : (branchesRes as { data: Branch[] }).data ?? [];

  const createCount = useMutation({
    mutationFn: (data: typeof form) => inventoryService.createStockCount(data),
    onSuccess: (newCount: unknown) => {
      toast({ title: 'Stock count started', description: 'Enter counted quantities for each product.' });
      queryClient.invalidateQueries({ queryKey: ['stock-counts'] });
      setOpen(false);
      setForm(emptyForm);
      const id = (newCount as StockCount)?.id;
      if (id) navigate(`/inventory/stock-count/${id}`);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Error', description: msg || 'Failed to create stock count', variant: 'destructive' });
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
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.items?.length ?? '—'}</span>
      ),
    },
    {
      header: 'Started',
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">
          {row.original.startedAt ? new Date(row.original.startedAt).toLocaleDateString('en-UG') : '—'}
        </span>
      ),
    },
    {
      header: 'Completed',
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">
          {row.original.completedAt ? new Date(row.original.completedAt).toLocaleDateString('en-UG') : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 h-7 text-xs"
          onClick={() => navigate(`/inventory/stock-count/${row.original.id}`)}
        >
          {row.original.status === 'COMPLETED'
            ? <><ClipboardCheck className="h-3 w-3" /> View</>
            : <><ClipboardList className="h-3 w-3" /> Enter Counts</>
          }
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Count"
        subtitle="Conduct physical inventory counts and update stock from real counts"
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
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes for this count"
                rows={2}
              />
            </div>
            <p className="text-xs text-gray-500">
              A count sheet will be created with all products in the selected branch pre-filled with current system quantities. You then enter the physical counted quantities.
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

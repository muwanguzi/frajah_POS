import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, ArrowRightLeft } from 'lucide-react';
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
interface Product { id: string; name: string; sku: string }

interface StockTransfer {
  id: string;
  transferNumber?: string;
  fromBranch?: { id: string; name: string };
  toBranch?: { id: string; name: string };
  product?: { id: string; name: string };
  quantity: number;
  status: string;
  notes?: string;
  createdAt: string;
}

const emptyForm = {
  fromBranchId: '',
  toBranchId: '',
  productId: '',
  quantity: '',
  notes: '',
};

export default function TransfersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: transfers = [], isLoading } = useQuery<StockTransfer[]>({
    queryKey: ['stock-transfers'],
    queryFn: () => apiClient.get('/inventory/transfers') as Promise<StockTransfer[]>,
    retry: false,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/branches') as Promise<Branch[]>,
    retry: false,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-all'],
    queryFn: () => apiClient.get('/products?limit=500') as Promise<Product[]>,
    retry: false,
  });

  const createTransfer = useMutation({
    mutationFn: (data: typeof form) =>
      apiClient.post('/inventory/transfers', {
        ...data,
        quantity: Number(data.quantity),
      }),
    onSuccess: () => {
      toast({ title: 'Transfer created successfully' });
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to create transfer', variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    if (!form.fromBranchId || !form.toBranchId || !form.productId || !form.quantity) {
      toast({ title: 'Validation', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    if (form.fromBranchId === form.toBranchId) {
      toast({ title: 'Validation', description: 'Source and destination branches must differ', variant: 'destructive' });
      return;
    }
    createTransfer.mutate(form);
  };

  const columns: ColumnDef<StockTransfer>[] = [
    { header: '#', cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>, size: 40 },
    {
      header: 'Transfer #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-blue-600">{row.original.transferNumber || row.original.id.slice(0, 8)}</span>
      ),
    },
    {
      header: 'Product',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.product?.name || '—'}</span>,
    },
    {
      header: 'From',
      cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.fromBranch?.name || '—'}</span>,
    },
    {
      header: 'To',
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-sm text-gray-600">
          <ArrowRightLeft className="h-3 w-3 text-gray-400" />
          {row.original.toBranch?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Qty',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.quantity}</span>,
    },
    {
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">{new Date(row.original.createdAt).toLocaleDateString('en-UG')}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Transfers"
        subtitle="Move stock between branches"
        actions={
          <Button className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Transfer
          </Button>
        }
      />

      <DataTable data={transfers} columns={columns} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Stock Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>From Branch *</Label>
              <Select value={form.fromBranchId} onValueChange={v => setForm(f => ({ ...f, fromBranchId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select source branch" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(branches) ? branches : []).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Branch *</Label>
              <Select value={form.toBranchId} onValueChange={v => setForm(f => ({ ...f, toBranchId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select destination branch" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(branches) ? branches : []).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product *</Label>
              <Select value={form.productId} onValueChange={v => setForm(f => ({ ...f, productId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(products) ? products : []).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {p.sku}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity *</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createTransfer.isPending}>
              {createTransfer.isPending ? 'Creating...' : 'Create Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

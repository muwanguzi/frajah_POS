import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpDown } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { inventoryService } from '@/services/inventory.service';
import { productsService } from '@/services/products.service';
import { useAuthStore } from '@/stores/auth.store';

interface Adjustment {
  id: string;
  product?: { id: string; name: string; sku: string };
  adjustmentType: string;
  quantity: number;
  reason: string;
  notes?: string;
  status?: string;
  createdAt: string;
}

const ADJUSTMENT_TYPES = [
  { value: 'INCREASE', label: 'Stock Increase (Surplus found)' },
  { value: 'DECREASE', label: 'Stock Decrease (Loss/Damage)' },
  { value: 'WRITE_OFF', label: 'Write Off (Expired/Damaged)' },
  { value: 'CORRECTION', label: 'Count Correction' },
];

export default function AdjustmentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const { data: adjustments = [], isLoading } = useQuery<Adjustment[]>({
    queryKey: ['adjustments'],
    queryFn: () => inventoryService.getAdjustments() as Promise<Adjustment[]>,
    retry: false,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: () => productsService.findAll({ search: productSearch, limit: 20 }),
    enabled: productSearch.length >= 2,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => inventoryService.createAdjustment(data),
    onSuccess: () => {
      toast.success('Stock adjustment created');
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      setOpen(false);
      setProductId(''); setAdjustmentType(''); setQuantity(''); setReason(''); setNotes('');
    },
    onError: () => toast.error('Failed to create adjustment'),
  });

  const handleSubmit = () => {
    if (!productId || !adjustmentType || !quantity || !reason) {
      toast.error('Fill in all required fields');
      return;
    }
    createMutation.mutate({
      productId,
      adjustmentType,
      quantity: Number(quantity),
      reason,
      notes: notes || undefined,
      branchId: user?.branchId || 'main',
      createdById: user?.id,
    });
  };

  const columns: ColumnDef<Adjustment>[] = [
    { header: '#', cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>, size: 40 },
    {
      header: 'Product',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.product?.name || '—'}</p>
          <p className="text-xs text-gray-400">{row.original.product?.sku}</p>
        </div>
      ),
    },
    {
      header: 'Type',
      cell: ({ row }) => {
        const t = row.original.adjustmentType;
        const color = t === 'INCREASE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
        return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{t}</span>;
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => {
        const t = row.original.adjustmentType;
        const sign = t === 'INCREASE' ? '+' : '-';
        const color = t === 'INCREASE' ? 'text-green-600' : 'text-red-600';
        return <span className={`font-semibold font-mono ${color}`}>{sign}{row.original.quantity}</span>;
      },
    },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.reason}</span> },
    {
      header: 'Date',
      cell: ({ row }) => <span className="text-xs text-gray-400">{new Date(row.original.createdAt).toLocaleDateString('en-UG')}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Adjustments"
        subtitle="Manually adjust inventory quantities"
        actions={
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Adjustment
          </Button>
        }
      />

      <DataTable data={adjustments} columns={columns} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              New Stock Adjustment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Product *</Label>
              <Input
                placeholder="Type product name or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              {productSearch.length >= 2 && (products as Array<{id: string; name: string; sku: string}>).length > 0 && (
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {(products as Array<{id: string; name: string; sku: string}>).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-sm"
                      onClick={() => { setProductId(p.id); setProductSearch(p.name); }}
                    >
                      {p.name} <span className="text-gray-400">({p.sku})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label>Adjustment Type *</Label>
              <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Quantity *</Label>
              <Input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>

            <div className="space-y-1">
              <Label>Reason *</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Physical count discrepancy" />
            </div>

            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional details..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Create Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

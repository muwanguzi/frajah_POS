import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
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
import { useBranchStore } from '@/stores/branch.store';

interface Adjustment {
  id: string;
  product?: { id: string; name: string; sku: string };
  type: string;
  quantity: string;
  reason: string;
  adjustmentNumber: string;
  createdAt: string;
}

interface ProductResult {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
}

const ADJUSTMENT_TYPES = [
  { value: 'OPENING_STOCK', label: 'Opening Stock', direction: 'in', description: 'Set initial stock after stock taking' },
  { value: 'INCREASE',      label: 'Stock Increase', direction: 'in', description: 'Surplus found during count' },
  { value: 'DECREASE',      label: 'Stock Decrease', direction: 'out', description: 'Loss or shrinkage' },
  { value: 'WRITE_OFF',     label: 'Write Off', direction: 'out', description: 'Expired or damaged goods' },
];

const INCREASE_TYPES = ['OPENING_STOCK', 'INCREASE', 'CORRECTION'];

function typeColor(type: string) {
  return INCREASE_TYPES.includes(type)
    ? 'bg-green-100 text-green-700'
    : 'bg-red-100 text-red-700';
}

function typeSign(type: string) {
  return INCREASE_TYPES.includes(type) ? '+' : '-';
}

export default function AdjustmentsPage() {
  const { user } = useAuthStore();
  const { activeBranchId } = useBranchStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [adjType, setAdjType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['adjustments'],
    queryFn: () => inventoryService.getAdjustments(),
    retry: false,
  });

  const adjustments: Adjustment[] = (rawData as any)?.data ?? (Array.isArray(rawData) ? rawData : []);

  const { data: searchRaw } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: () => productsService.findAll({ search: productSearch, limit: 20 }),
    enabled: productSearch.length >= 2,
    retry: false,
  });
  const products: ProductResult[] = (searchRaw as any)?.data ?? (Array.isArray(searchRaw) ? searchRaw : []);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => inventoryService.createAdjustment(data),
    onSuccess: () => {
      toast.success('Stock adjustment saved — inventory updated');
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || 'Failed to create adjustment');
    },
  });

  function resetForm() {
    setProductId('');
    setSelectedProduct(null);
    setAdjType('');
    setQuantity('');
    setReason('');
    setNotes('');
    setProductSearch('');
    setShowDropdown(false);
  }

  const handleSubmit = () => {
    if (!productId) { toast.error('Select a product'); return; }
    if (!adjType)   { toast.error('Select adjustment type'); return; }
    if (!quantity || Number(quantity) <= 0) { toast.error('Enter a valid quantity'); return; }
    if (!reason)    { toast.error('Enter a reason'); return; }

    const branchId = activeBranchId || user?.branchId;

    createMutation.mutate({
      productId,
      type: adjType,
      quantity: Number(quantity),
      reason,
      notes: notes || undefined,
      branchId,
      adjustedById: user?.id,
    });
  };

  const columns: ColumnDef<Adjustment>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs font-mono">{row.original.adjustmentNumber}</span>
      ),
    },
    {
      header: 'Product',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.product?.name ?? '—'}</p>
          <p className="text-xs text-gray-400">{row.original.product?.sku}</p>
        </div>
      ),
    },
    {
      header: 'Type',
      cell: ({ row }) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor(row.original.type)}`}>
          {row.original.type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Qty Change',
      cell: ({ row }) => {
        const sign = typeSign(row.original.type);
        const color = sign === '+' ? 'text-green-600' : 'text-red-600';
        return (
          <span className={`font-semibold font-mono ${color}`}>
            {sign}{Number(row.original.quantity).toLocaleString()}
          </span>
        );
      },
    },
    {
      header: 'Reason',
      cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.reason}</span>,
    },
    {
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">
          {new Date(row.original.createdAt).toLocaleDateString('en-UG')}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Adjustments"
        subtitle="Adjust inventory quantities after stock taking or to correct discrepancies"
        actions={
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Adjustment
          </Button>
        }
      />

      <DataTable data={adjustments} columns={columns} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              New Stock Adjustment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Product search */}
            <div className="space-y-1 relative">
              <Label>Product *</Label>
              <Input
                placeholder="Type product name or SKU to search..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductId('');
                  setSelectedProduct(null);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && productSearch.length >= 2 && products.length > 0 && (
                <div className="absolute z-50 w-full border rounded-md shadow bg-white max-h-40 overflow-y-auto">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center justify-between"
                      onClick={() => {
                        setProductId(p.id);
                        setSelectedProduct(p);
                        setProductSearch(p.name);
                        setShowDropdown(false);
                      }}
                    >
                      <span>{p.name}</span>
                      <span className="text-xs text-gray-400">{p.sku} · Stock: {p.currentStock ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedProduct && (
                <p className="text-xs text-blue-600 mt-1">
                  Current stock: <strong>{Number(selectedProduct.currentStock ?? 0).toLocaleString()}</strong> units
                </p>
              )}
            </div>

            {/* Adjustment type */}
            <div className="space-y-1">
              <Label>Adjustment Type *</Label>
              <Select value={adjType} onValueChange={setAdjType}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        {t.direction === 'in'
                          ? <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                          : <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                        }
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {adjType && (
                <p className="text-xs text-gray-500">
                  {ADJUSTMENT_TYPES.find(t => t.value === adjType)?.description}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-1">
              <Label>Quantity *</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
              {selectedProduct && quantity && Number(quantity) > 0 && (
                <p className="text-xs text-gray-500">
                  New stock will be:{' '}
                  <strong>
                    {INCREASE_TYPES.includes(adjType)
                      ? Number(selectedProduct.currentStock ?? 0) + Number(quantity)
                      : Math.max(0, Number(selectedProduct.currentStock ?? 0) - Number(quantity))
                    }
                  </strong>{' '}units
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <Label>Reason *</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={adjType === 'OPENING_STOCK' ? 'Opening stock after stock taking' : 'e.g. Physical count discrepancy'}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional details..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Package, AlertTriangle, Save } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { inventoryService } from '@/services/inventory.service';

interface Product {
  id: string;
  name: string;
  sku?: string;
  unitOfMeasure?: string;
}

interface CountItem {
  id: string;
  productId: string;
  product?: Product;
  systemQuantity: string;
  countedQuantity: string;
  variance: string;
}

interface StockCount {
  id: string;
  countNumber: string;
  branch?: { id: string; name: string };
  status: string;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  items: CountItem[];
}

export default function StockCountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local edits keyed by itemId before saving to server
  const [localCounts, setLocalCounts] = useState<Record<string, string>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [filter, setFilter] = useState<'all' | 'variance' | 'uncounted'>('all');

  const { data: count, isLoading } = useQuery<StockCount>({
    queryKey: ['stock-count', id],
    queryFn: () => inventoryService.getStockCountById(id!) as Promise<StockCount>,
    enabled: !!id,
  });

  const saveItem = useMutation({
    mutationFn: ({ itemId, qty }: { itemId: string; qty: number }) =>
      inventoryService.updateCountItem(id!, itemId, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-count', id] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save count', variant: 'destructive' });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => inventoryService.completeStockCount(id!),
    onSuccess: () => {
      toast({ title: 'Stock count completed', description: 'Stock levels have been updated.' });
      queryClient.invalidateQueries({ queryKey: ['stock-count', id] });
      queryClient.invalidateQueries({ queryKey: ['stock-counts'] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Error', description: msg || 'Failed to complete count', variant: 'destructive' });
    },
  });

  const handleCountChange = useCallback((itemId: string, value: string) => {
    setLocalCounts(prev => ({ ...prev, [itemId]: value }));
  }, []);

  const handleSaveItem = useCallback(async (item: CountItem) => {
    const raw = localCounts[item.id] ?? item.countedQuantity;
    const qty = parseFloat(raw);
    if (isNaN(qty) || qty < 0) {
      toast({ title: 'Invalid quantity', variant: 'destructive' });
      return;
    }
    setSavingItemId(item.id);
    await saveItem.mutateAsync({ itemId: item.id, qty });
    setLocalCounts(prev => { const n = { ...prev }; delete n[item.id]; return n; });
    setSavingItemId(null);
  }, [localCounts, saveItem, toast]);

  const handleBlurSave = useCallback((item: CountItem) => {
    if (localCounts[item.id] !== undefined) {
      handleSaveItem(item);
    }
  }, [localCounts, handleSaveItem]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading count sheet...
      </div>
    );
  }

  if (!count) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-gray-500">Stock count not found.</p>
        <Button variant="outline" onClick={() => navigate('/inventory/stock-count')}>
          Back to list
        </Button>
      </div>
    );
  }

  const isCompleted = count.status === 'COMPLETED';
  const items = count.items ?? [];

  const filteredItems = items.filter(item => {
    if (filter === 'variance') return Number(item.variance) !== 0;
    if (filter === 'uncounted') {
      const counted = localCounts[item.id] ?? item.countedQuantity;
      return Number(counted) === 0;
    }
    return true;
  });

  const totalVariance = items.reduce((sum, i) => sum + Number(i.variance), 0);
  const itemsWithVariance = items.filter(i => Number(i.variance) !== 0).length;
  const unsavedCount = Object.keys(localCounts).length;

  return (
    <div>
      <PageHeader
        title={count.countNumber}
        subtitle={`Stock count for ${count.branch?.name ?? 'branch'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/inventory/stock-count')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {!isCompleted && (
              <Button
                size="sm"
                variant="default"
                className="gap-1.5 bg-green-600 hover:bg-green-700"
                onClick={() => setConfirmComplete(true)}
                disabled={completeMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete & Apply
              </Button>
            )}
          </div>
        }
      />

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 text-sm">
          <Package className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500">Products:</span>
          <span className="font-semibold">{items.length}</span>
        </div>
        <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-gray-500">With variance:</span>
          <span className={`font-semibold ${itemsWithVariance > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
            {itemsWithVariance}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 text-sm">
          <span className="text-gray-500">Net variance:</span>
          <span className={`font-semibold font-mono ${totalVariance < 0 ? 'text-red-600' : totalVariance > 0 ? 'text-green-600' : 'text-gray-500'}`}>
            {totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(2)}
          </span>
        </div>
        <StatusBadge status={count.status} />
        {unsavedCount > 0 && (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
            {unsavedCount} unsaved change{unsavedCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(['all', 'variance', 'uncounted'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-blue-900 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All items' : f === 'variance' ? 'Has variance' : 'Uncounted (0)'}
          </button>
        ))}
      </div>

      {/* Count sheet table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-right px-4 py-3 font-medium">System Qty</th>
                <th className="text-right px-4 py-3 font-medium w-36">Counted Qty</th>
                <th className="text-right px-4 py-3 font-medium">Variance</th>
                {!isCompleted && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No items match this filter
                  </td>
                </tr>
              )}
              {filteredItems.map((item, idx) => {
                const displayCounted = localCounts[item.id] ?? item.countedQuantity;
                const system = Number(item.systemQuantity);
                const counted = parseFloat(displayCounted) || 0;
                const liveVariance = counted - system;
                const hasUnsaved = localCounts[item.id] !== undefined;
                const isSaving = savingItemId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${hasUnsaved ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'}`}
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {item.product?.name ?? item.productId.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {item.product?.sku ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">
                      {system.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isCompleted ? (
                        <span className="font-mono text-gray-700">
                          {Number(item.countedQuantity).toFixed(2)}
                        </span>
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={displayCounted}
                          onChange={e => handleCountChange(item.id, e.target.value)}
                          onBlur={() => handleBlurSave(item)}
                          className="w-28 h-8 text-right font-mono text-sm ml-auto"
                          disabled={isSaving}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      <span className={
                        liveVariance < 0 ? 'text-red-600' :
                        liveVariance > 0 ? 'text-green-600' :
                        'text-gray-400'
                      }>
                        {liveVariance > 0 ? '+' : ''}{liveVariance.toFixed(2)}
                      </span>
                    </td>
                    {!isCompleted && (
                      <td className="px-4 py-3">
                        {hasUnsaved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-blue-600"
                            onClick={() => handleSaveItem(item)}
                            disabled={isSaving}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {isSaving ? 'Saving…' : 'Save'}
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isCompleted && count.completedAt && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Completed on {new Date(count.completedAt).toLocaleString('en-UG')}
        </p>
      )}

      <Dialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete stock count?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              This will update stock levels for all{' '}
              <strong>{items.length} products</strong> to match the counted quantities.
            </p>
            {itemsWithVariance > 0 && (
              <p className="text-amber-700">
                {itemsWithVariance} product{itemsWithVariance > 1 ? 's have' : ' has'} variance — stock adjustments will be logged automatically.
              </p>
            )}
            <p className="text-red-600 font-medium">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmComplete(false)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => { completeMutation.mutate(); setConfirmComplete(false); }}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? 'Applying…' : 'Yes, complete & apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

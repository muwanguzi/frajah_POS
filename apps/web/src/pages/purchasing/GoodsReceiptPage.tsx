import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PackageCheck, Package } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { purchasingService } from '@/services/purchasing.service';
import { useAuthStore } from '@/stores/auth.store';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier?: { id: string; name: string };
  status: string;
  total: string | number;
  items: Array<{
    id: string;
    productId: string;
    product?: { id: string; name: string; sku: string };
    quantityOrdered: string | number;
    quantityReceived: string | number;
    unitCost: string | number;
  }>;
}

interface ReceiveItem {
  purchaseOrderItemId: string;
  productName: string;
  quantityOrdered: number;
  quantityAlreadyReceived: number;
  quantityReceived: number;
  quantityDamaged: number;
  expiryDate: string;
}

export default function GoodsReceiptPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);

  const { data: pendingPOs = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', 'pending'],
    queryFn: () => purchasingService.getPurchaseOrders({ status: 'SENT' }) as Promise<PurchaseOrder[]>,
    retry: false,
  });

  const receiveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => purchasingService.receiveGoods(data),
    onSuccess: () => {
      toast.success('Goods received successfully! Batch and stock updated.');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setReceiveDialogOpen(false);
      setSelectedPO(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to receive goods');
    },
  });

  const filtered = pendingPOs.filter((po) =>
    !search ||
    po.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
    po.supplier?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenReceive = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setReceiveItems(
      (po.items || []).map((item) => ({
        purchaseOrderItemId: item.id,
        productName: item.product?.name || item.productId,
        quantityOrdered: parseFloat(item.quantityOrdered as string),
        quantityAlreadyReceived: parseFloat(item.quantityReceived as string),
        quantityReceived: parseFloat(item.quantityOrdered as string) - parseFloat(item.quantityReceived as string),
        quantityDamaged: 0,
        expiryDate: '',
      })),
    );
    setReceiveNotes('');
    setReceiveDialogOpen(true);
  };

  const handleSubmitReceive = () => {
    if (!selectedPO || !user) return;

    const validItems = receiveItems.filter((i) => i.quantityReceived > 0);
    if (validItems.length === 0) {
      toast.error('At least one item must have a received quantity');
      return;
    }

    receiveMutation.mutate({
      purchaseOrderId: selectedPO.id,
      branchId: user.branchId || 'main',
      receivedById: user.id,
      notes: receiveNotes || undefined,
      items: validItems.map((i) => ({
        purchaseOrderItemId: i.purchaseOrderItemId,
        quantityReceived: i.quantityReceived,
        quantityDamaged: i.quantityDamaged,
        expiryDate: i.expiryDate || undefined,
      })),
    });
  };

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      header: '#',
      cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>,
      size: 40,
    },
    {
      accessorKey: 'poNumber',
      header: 'PO Number',
      cell: ({ row }) => (
        <span className="font-mono text-blue-600 font-semibold text-sm">
          {row.original.poNumber}
        </span>
      ),
    },
    {
      header: 'Supplier',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.supplier?.name || '—'}</span>
      ),
    },
    {
      header: 'Items',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.items?.length || 0} items</Badge>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const color =
          s === 'RECEIVED'
            ? 'bg-green-100 text-green-700'
            : s === 'PARTIALLY_RECEIVED'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-blue-100 text-blue-700';
        return <Badge className={color}>{s.replace('_', ' ')}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenReceive(row.original)}
          className="gap-1.5"
        >
          <PackageCheck className="h-3.5 w-3.5" />
          Receive Goods
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Goods Receipts"
        subtitle="Receive goods against approved purchase orders"
      />

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        toolbar={
          <SearchInput
            placeholder="Search by PO number or supplier..."
            onSearch={setSearch}
            className="w-72"
          />
        }
      />

      {/* Receive Goods Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />
              Receive Goods — {selectedPO?.poNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                Supplier: <strong>{selectedPO.supplier?.name}</strong>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700">Items to Receive</h3>
                {receiveItems.map((item, idx) => (
                  <div key={item.purchaseOrderItemId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.productName}</span>
                      <span className="text-xs text-gray-400">
                        Ordered: {item.quantityOrdered} | Already Received: {item.quantityAlreadyReceived}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Qty Received *</Label>
                        <Input
                          type="number"
                          min={0}
                          max={item.quantityOrdered - item.quantityAlreadyReceived}
                          value={item.quantityReceived}
                          onChange={(e) => {
                            const updated = [...receiveItems];
                            updated[idx].quantityReceived = Number(e.target.value);
                            setReceiveItems(updated);
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Qty Damaged</Label>
                        <Input
                          type="number"
                          min={0}
                          value={item.quantityDamaged}
                          onChange={(e) => {
                            const updated = [...receiveItems];
                            updated[idx].quantityDamaged = Number(e.target.value);
                            setReceiveItems(updated);
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Expiry Date</Label>
                        <Input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => {
                            const updated = [...receiveItems];
                            updated[idx].expiryDate = e.target.value;
                            setReceiveItems(updated);
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <Label className="text-sm">Notes (optional)</Label>
                <Input
                  placeholder="Any notes about this delivery..."
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReceive}
              disabled={receiveMutation.isPending}
              className="gap-1.5"
            >
              <PackageCheck className="h-4 w-4" />
              {receiveMutation.isPending ? 'Processing...' : 'Confirm Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

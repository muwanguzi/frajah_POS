import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Ban, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { purchasingService } from '@/services/purchasing.service';
import { formatUGX } from '@/lib/currency';

interface PurchaseOrderItem {
  id: string;
  productId: string;
  product?: { id: string; name: string; sku: string };
  quantityOrdered: string | number;
  quantityReceived: string | number;
  unitCost: string | number;
  lineTotal: string | number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier?: { id: string; name: string; phone?: string } | null;
  branch?: { id: string; name: string } | null;
  status: string;
  orderDate?: string;
  expectedDate?: string | null;
  subtotal: string | number;
  taxAmount: string | number;
  total: string | number;
  notes?: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
}

// Mirrors the backend's PO_STATUS_TRANSITIONS — only manual transitions are listed
// here; RECEIVED/PARTIALLY_RECEIVED are system-derived via goods receiving.
const MANUAL_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['CANCELLED'],
  PARTIALLY_RECEIVED: ['CANCELLED'],
  RECEIVED: [],
  CANCELLED: [],
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-UG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: po, isLoading } = useQuery<PurchaseOrder>({
    queryKey: ['purchase-order', id],
    queryFn: () => purchasingService.getPurchaseOrder(id!) as Promise<PurchaseOrder>,
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => purchasingService.updatePurchaseOrderStatus(id!, status),
    onSuccess: () => {
      toast.success('Purchase order updated');
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (e: unknown) => {
      const msg = (e as Error)?.message;
      toast.error(msg || 'Failed to update purchase order');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Purchase order not found</p>
        <Button variant="ghost" onClick={() => navigate('/purchasing/orders')} className="mt-2">
          Back to Purchase Orders
        </Button>
      </div>
    );
  }

  const allowed = MANUAL_TRANSITIONS[po.status] ?? [];

  return (
    <div>
      <PageHeader
        title={po.poNumber}
        subtitle={po.supplier?.name ? `Supplier: ${po.supplier.name}` : 'Purchase order'}
        actions={
          <div className="flex items-center gap-2">
            {allowed.includes('SENT') && (
              <Button
                className="gap-1.5"
                onClick={() => statusMutation.mutate('SENT')}
                disabled={statusMutation.isPending}
              >
                <Send className="h-4 w-4" />
                Send to Supplier
              </Button>
            )}
            {allowed.includes('CANCELLED') && (
              <Button
                variant="outline"
                className="gap-1.5 text-red-600 hover:text-red-700"
                onClick={() => {
                  if (confirm('Cancel this purchase order? This cannot be undone.')) {
                    statusMutation.mutate('CANCELLED');
                  }
                }}
                disabled={statusMutation.isPending}
              >
                <Ban className="h-4 w-4" />
                Cancel Order
              </Button>
            )}
            <Button variant="outline" className="gap-1.5" onClick={() => navigate('/purchasing/orders')}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <StatusBadge status={po.status === 'PARTIALLY_RECEIVED' ? 'PARTIAL' : po.status} />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              Ordered {formatDate(po.orderDate)}
            </div>
            {po.expectedDate && (
              <div className="text-sm text-gray-500">
                Expected delivery: {formatDate(po.expectedDate)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Supplier & Branch</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Supplier: </span>
              {po.supplier?.name || '—'}
            </div>
            <div>
              <span className="text-gray-400">Branch: </span>
              {po.branch?.name || '—'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Totals</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-mono">{formatUGX(Number(po.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tax</span>
              <span className="font-mono">{formatUGX(Number(po.taxAmount))}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1.5">
              <span>Total</span>
              <span className="font-mono text-blue-700">{formatUGX(Number(po.total))}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{item.product?.name || item.productId}</p>
                    {item.product?.sku && <p className="text-xs text-gray-400">{item.product.sku}</p>}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{item.quantityOrdered}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    <span
                      className={
                        Number(item.quantityReceived) >= Number(item.quantityOrdered)
                          ? 'text-green-700'
                          : Number(item.quantityReceived) > 0
                          ? 'text-orange-600'
                          : 'text-gray-400'
                      }
                    >
                      {item.quantityReceived}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatUGX(Number(item.unitCost))}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    {formatUGX(Number(item.lineTotal))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {po.notes && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent className="text-sm text-gray-600">{po.notes}</CardContent>
        </Card>
      )}
    </div>
  );
}

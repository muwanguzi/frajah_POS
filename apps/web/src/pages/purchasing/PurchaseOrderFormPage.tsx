import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { purchasingService } from '@/services/purchasing.service';
import { suppliersService } from '@/services/suppliers.service';
import { productsService } from '@/services/products.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatUGX } from '@/lib/currency';

interface Supplier { id: string; name: string; }
interface Product { id: string; name: string; sku: string; costPrice: number; unitOfMeasure: string; }

interface OrderLine {
  productId: string;
  productName: string;
  sku: string;
  quantityOrdered: number;
  unitCost: number;
}

export default function PurchaseOrderFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers-list'],
    queryFn: () => suppliersService.findAll() as Promise<Supplier[]>,
    retry: false,
  });

  const { data: searchResults = [] } = useQuery<Product[]>({
    queryKey: ['products-search', productSearch],
    queryFn: () =>
      productsService.findAll({ search: productSearch, limit: 10 }) as Promise<Product[]>,
    enabled: productSearch.length >= 2,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      purchasingService.createPurchaseOrder(data),
    onSuccess: () => {
      toast.success('Purchase order created successfully');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      navigate('/purchasing/orders');
    },
    onError: () => {
      toast.error('Failed to create purchase order');
    },
  });

  const addLine = (product: Product) => {
    const exists = lines.find((l) => l.productId === product.id);
    if (exists) {
      toast.error('Product already in the order');
      return;
    }
    setLines([
      ...lines,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantityOrdered: 1,
        unitCost: product.costPrice || 0,
      },
    ]);
    setProductSearch('');
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof OrderLine, value: number) => {
    const updated = [...lines];
    (updated[idx] as unknown as Record<string, unknown>)[field] = value;
    setLines(updated);
  };

  const subtotal = lines.reduce((sum, l) => sum + l.quantityOrdered * l.unitCost, 0);

  const handleSubmit = () => {
    if (!supplierId) { toast.error('Select a supplier'); return; }
    if (lines.length === 0) { toast.error('Add at least one product'); return; }

    createMutation.mutate({
      supplierId,
      branchId: user?.branchId || 'main',
      createdById: user?.id || '',
      expectedDate: expectedDate || undefined,
      notes: notes || undefined,
      items: lines.map((l) => ({
        productId: l.productId,
        quantityOrdered: l.quantityOrdered,
        unitCost: l.unitCost,
      })),
    });
  };

  return (
    <div>
      <PageHeader
        title="New Purchase Order"
        subtitle="Create a purchase order to send to a supplier"
        actions={
          <Button variant="outline" onClick={() => navigate('/purchasing/orders')}>
            Cancel
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <Label>Supplier *</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any special instructions or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Lines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Search products to add..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSearch.length >= 2 && searchResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center justify-between"
                        onClick={() => addLine(product)}
                      >
                        <span>
                          <span className="font-medium">{product.name}</span>
                          <span className="text-gray-400 text-xs ml-2">{product.sku}</span>
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatUGX(product.costPrice)} / {product.unitOfMeasure}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {lines.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-28">Qty</TableHead>
                      <TableHead className="w-36">Unit Cost (UGX)</TableHead>
                      <TableHead className="w-32 text-right">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, idx) => (
                      <TableRow key={line.productId}>
                        <TableCell>
                          <p className="font-medium text-sm">{line.productName}</p>
                          <p className="text-xs text-gray-400">{line.sku}</p>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={line.quantityOrdered}
                            onChange={(e) => updateLine(idx, 'quantityOrdered', Number(e.target.value))}
                            className="h-8 w-24 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={line.unitCost}
                            onChange={(e) => updateLine(idx, 'unitCost', Number(e.target.value))}
                            className="h-8 w-32 text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {formatUGX(line.quantityOrdered * line.unitCost)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => removeLine(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center py-10 text-gray-400">
                  <Plus className="h-8 w-8 mb-2 text-gray-200" />
                  <p className="text-sm">Search and add products above</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Products</span>
                <span className="font-medium">{lines.length} items</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatUGX(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-400">TBD</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-blue-700 text-lg">{formatUGX(subtotal)}</span>
              </div>

              <Button
                className="w-full mt-4"
                onClick={handleSubmit}
                disabled={createMutation.isPending || lines.length === 0 || !supplierId}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Purchase Order
              </Button>

              <p className="text-xs text-center text-gray-400">
                Order will be created as DRAFT. Send to supplier after review.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

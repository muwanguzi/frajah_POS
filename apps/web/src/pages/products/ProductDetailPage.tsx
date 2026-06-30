import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { productsService } from '@/services/products.service';
import { formatUGX } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  brand?: string;
  category?: { name: string };
  unitOfMeasure: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  minSellingPrice?: number;
  vatRate: number;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  maxStock?: number;
  safetyStock?: number;
  costingMethod: string;
  isActive: boolean;
  isService: boolean;
  serialTracking: boolean;
  batchTracking: boolean;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => productsService.findOne(id!) as Promise<Product>,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Product not found</p>
        <Button className="mt-4" onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={`SKU: ${product.sku}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/products')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/products/${id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={product.isActive ? 'ACTIVE' : 'INACTIVE'} />
        {product.isService && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            Service Item
          </span>
        )}
        {product.batchTracking && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            Batch Tracking
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Product Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: 'Product Name', value: product.name },
              { label: 'SKU', value: product.sku },
              { label: 'Barcode', value: product.barcode || '—' },
              { label: 'Brand', value: product.brand || '—' },
              { label: 'Category', value: product.category?.name || '—' },
              { label: 'Unit of Measure', value: product.unitOfMeasure },
              { label: 'Description', value: product.description || '—' },
              { label: 'Cost Price', value: formatUGX(product.costPrice) },
              { label: 'Selling Price', value: formatUGX(product.sellingPrice) },
              { label: 'Wholesale Price', value: product.wholesalePrice ? formatUGX(product.wholesalePrice) : '—' },
              { label: 'VAT Rate', value: `${(product.vatRate * 100).toFixed(0)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Inventory Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              {
                label: 'Current Stock',
                value: (
                  <span
                    className={
                      product.currentStock <= product.reorderLevel
                        ? 'text-red-600 font-bold'
                        : 'font-medium'
                    }
                  >
                    {product.currentStock} {product.unitOfMeasure}
                  </span>
                ),
              },
              { label: 'Reorder Level', value: `${product.reorderLevel} ${product.unitOfMeasure}` },
              { label: 'Reorder Quantity', value: `${product.reorderQuantity} ${product.unitOfMeasure}` },
              { label: 'Max Stock', value: product.maxStock ? `${product.maxStock} ${product.unitOfMeasure}` : '—' },
              { label: 'Safety Stock', value: product.safetyStock ? `${product.safetyStock} ${product.unitOfMeasure}` : '—' },
              { label: 'Costing Method', value: product.costingMethod },
              { label: 'Serial Tracking', value: product.serialTracking ? 'Yes' : 'No' },
              { label: 'Batch Tracking', value: product.batchTracking ? 'Yes' : 'No' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="history">Purchase History</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-sm text-center py-8">
                Stock level details by branch will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="batches" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-sm text-center py-8">
                Batch/lot information will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-sm text-center py-8">
                Purchase history will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

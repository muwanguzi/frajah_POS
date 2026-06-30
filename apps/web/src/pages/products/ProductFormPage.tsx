import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { productsService } from '@/services/products.service';
import { categoriesService } from '@/services/categories.service';

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(2, 'SKU is required'),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  categoryId: z.string().optional(),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  description: z.string().optional(),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().optional(),
  minSellingPrice: z.coerce.number().optional(),
  vatRate: z.coerce.number().default(0),
  reorderLevel: z.coerce.number().min(0).default(10),
  reorderQuantity: z.coerce.number().min(0).default(50),
  maxStock: z.coerce.number().min(0).optional(),
  safetyStock: z.coerce.number().min(0).optional(),
  costingMethod: z.enum(['FIFO', 'LIFO', 'WAC']).default('FIFO'),
  isActive: z.boolean().default(true),
  isService: z.boolean().default(false),
  serialTracking: z.boolean().default(false),
  batchTracking: z.boolean().default(false),
  warrantyPeriod: z.coerce.number().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

const UOM_OPTIONS = [
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'litre', label: 'Litre' },
  { value: 'metre', label: 'Metre' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'carton', label: 'Carton' },
];

const COSTING_METHODS = [
  {
    value: 'FIFO',
    label: 'FIFO — First In, First Out',
    description: 'Oldest inventory sold first. Common for perishables.',
  },
  {
    value: 'LIFO',
    label: 'LIFO — Last In, First Out',
    description: 'Newest inventory sold first.',
  },
  {
    value: 'WAC',
    label: 'WAC — Weighted Average Cost',
    description: 'Average cost across all batches. Most common.',
  },
];

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesService.findAll() as Promise<Category[]>,
    retry: false,
  });

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.findOne(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({ resolver: zodResolver(productSchema) });

  useEffect(() => {
    if (product) {
      reset(product as ProductFormData);
    }
  }, [product, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProductFormData) =>
      isEdit
        ? productsService.update(id!, data)
        : productsService.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated successfully' : 'Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    },
  });

  const generateSKU = () => {
    const name = watch('name');
    if (!name) return;
    const sku = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8) + '-' + Math.floor(Math.random() * 9000 + 1000);
    setValue('sku', sku);
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Product' : 'Add New Product'}
        subtitle={isEdit ? `Editing: ${(product as { name?: string })?.name}` : 'Create a new product'}
        actions={
          <Button variant="outline" onClick={() => navigate('/products')}>
            Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g. Coca-Cola 500ml"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Product Code *</Label>
                  <div className="flex gap-2">
                    <Input id="sku" {...register('sku')} placeholder="e.g. COKE-500" />
                    <Button type="button" variant="outline" onClick={generateSKU}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.sku && (
                    <p className="text-xs text-red-500">{errors.sku.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" {...register('barcode')} placeholder="Scan or type barcode" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" {...register('brand')} placeholder="e.g. Coca-Cola" />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={watch('categoryId') || ''}
                    onValueChange={(val) => setValue('categoryId', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unit of Measure *</Label>
                  <Select
                    value={watch('unitOfMeasure') || ''}
                    onValueChange={(val) => setValue('unitOfMeasure', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UOM_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Product description..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price (UGX) *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    {...register('costPrice')}
                    placeholder="0"
                  />
                  {errors.costPrice && (
                    <p className="text-xs text-red-500">{errors.costPrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Selling Price (UGX) *</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    {...register('sellingPrice')}
                    placeholder="0"
                  />
                  {errors.sellingPrice && (
                    <p className="text-xs text-red-500">{errors.sellingPrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wholesalePrice">Wholesale Price (UGX)</Label>
                  <Input
                    id="wholesalePrice"
                    type="number"
                    {...register('wholesalePrice')}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minSellingPrice">Minimum Selling Price (UGX)</Label>
                  <Input
                    id="minSellingPrice"
                    type="number"
                    {...register('minSellingPrice')}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>VAT Rate</Label>
                  <Select
                    value={String(watch('vatRate') ?? 0)}
                    onValueChange={(val) => setValue('vatRate', Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% — Exempt</SelectItem>
                      <SelectItem value="0.18">18% — Standard VAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input type="number" {...register('reorderLevel')} placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
                    <Input type="number" {...register('reorderQuantity')} placeholder="50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStock">Max Stock</Label>
                    <Input type="number" {...register('maxStock')} placeholder="500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="safetyStock">Safety Stock</Label>
                    <Input type="number" {...register('safetyStock')} placeholder="20" />
                  </div>
                </div>

                <div>
                  <Label className="block mb-3">Costing Method</Label>
                  <div className="grid gap-3">
                    {COSTING_METHODS.map((method) => (
                      <label
                        key={method.value}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          watch('costingMethod') === method.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          value={method.value}
                          {...register('costingMethod')}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{method.label}</p>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional Tab */}
          <TabsContent value="additional">
            <Card>
              <CardContent className="p-6 space-y-6">
                {[
                  { field: 'isActive' as const, label: 'Active', description: 'Product is available for sale' },
                  { field: 'isService' as const, label: 'Service Item', description: 'No stock tracking required' },
                  { field: 'serialTracking' as const, label: 'Serial Number Tracking', description: 'Track each unit by serial number' },
                  { field: 'batchTracking' as const, label: 'Batch Tracking', description: 'Track items by batch/lot number' },
                ].map(({ field, label, description }) => (
                  <div key={field} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                    <Switch
                      checked={watch(field) as boolean || false}
                      onCheckedChange={(val) => setValue(field, val)}
                    />
                  </div>
                ))}

                <div className="space-y-2">
                  <Label htmlFor="warrantyPeriod">Warranty Period (months)</Label>
                  <Input
                    id="warrantyPeriod"
                    type="number"
                    {...register('warrantyPeriod')}
                    placeholder="12"
                    className="w-40"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/products')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {(isSubmitting || mutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}

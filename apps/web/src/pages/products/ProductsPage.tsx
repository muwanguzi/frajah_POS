import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Upload, Download } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { productsService } from '@/services/products.service';
import { categoriesService } from '@/services/categories.service';
import { formatUGX } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  sku: string;
  category?: { id: string; name: string };
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  isActive: boolean;
  unitOfMeasure: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', search, categoryId, status],
    queryFn: () =>
      productsService.findAll({ search, categoryId: categoryId || undefined, status: status || undefined }) as Promise<Product[]>,
    retry: false,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesService.findAll() as Promise<Category[]>,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.remove(id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteId(null);
    },
  });

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  const columns: ColumnDef<Product>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.name}</p>
          <p className="text-xs text-gray-400">{row.original.sku}</p>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.category?.name || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'costPrice',
      header: 'Cost Price',
      cell: ({ row }) => (
        <span className="text-sm font-mono">
          {formatUGX(row.original.costPrice)}
        </span>
      ),
    },
    {
      accessorKey: 'sellingPrice',
      header: 'Selling Price',
      cell: ({ row }) => (
        <span className="text-sm font-mono font-medium text-blue-600">
          {formatUGX(row.original.sellingPrice)}
        </span>
      ),
    },
    {
      accessorKey: 'currentStock',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = row.original.currentStock;
        const reorder = row.original.reorderLevel;
        const isLow = stock <= reorder;
        return (
          <span
            className={`text-sm font-semibold ${isLow ? 'text-red-600' : 'text-gray-700'}`}
          >
            {stock} {row.original.unitOfMeasure}
          </span>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(`/products/${row.original.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(`/products/${row.original.id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3 w-full">
      <SearchInput
        placeholder="Search products..."
        onSearch={handleSearch}
        className="w-64"
      />
      <Select value={categoryId} onValueChange={setCategoryId}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products total`}
        actions={
          <Button onClick={() => navigate('/products/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        }
      />

      <DataTable
        data={products}
        columns={columns}
        isLoading={isLoading}
        toolbar={toolbar}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete Product"
      />
    </div>
  );
}

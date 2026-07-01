import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SearchInput } from '@/components/shared/SearchInput';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { inventoryService } from '@/services/inventory.service';
import { branchesService } from '@/services/branches.service';
import { cn } from '@/lib/utils';

interface StockLevel {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    reorderLevel?: number;
    unitOfMeasure?: string;
  };
  branch: { id: string; name: string };
  quantityOnHand: number;
  quantityReserved: number;
  reorderLevel?: number;
}

interface Branch {
  id: string;
  name: string;
}

type StockStatus = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';

function getStockStatus(
  quantityOnHand: number,
  reorderLevel: number
): StockStatus {
  if (quantityOnHand === 0) return 'OUT_OF_STOCK';
  if (quantityOnHand <= reorderLevel) return 'LOW_STOCK';
  return 'IN_STOCK';
}

const STOCK_STATUS_CONFIG: Record<
  StockStatus,
  { label: string; className: string }
> = {
  IN_STOCK: {
    label: 'In Stock',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  LOW_STOCK: {
    label: 'Low Stock',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

function StockStatusBadge({ status }: { status: StockStatus }) {
  const config = STOCK_STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn(config.className, 'font-medium')}>
      {config.label}
    </Badge>
  );
}

export default function InventoryPage() {
  const [branchId, setBranchId] = useState('all');
  const [search, setSearch] = useState('');

  const { data: stockLevels = [], isLoading } = useQuery<StockLevel[]>({
    queryKey: ['stock-levels', branchId],
    queryFn: () =>
      inventoryService.getStockLevels(
        branchId && branchId !== 'all' ? { branchId } : undefined
      ) as Promise<StockLevel[]>,
    retry: false,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => branchesService.getBranches() as Promise<Branch[]>,
    retry: false,
  });

  const handleSearch = useCallback((val: string) => setSearch(val), []);

  const filteredStock = search
    ? stockLevels.filter(
        (s) =>
          s.product.name.toLowerCase().includes(search.toLowerCase()) ||
          s.product.sku.toLowerCase().includes(search.toLowerCase())
      )
    : stockLevels;

  // Summary counts
  const outOfStock = filteredStock.filter(
    (s) => s.quantityOnHand === 0
  ).length;
  const lowStock = filteredStock.filter((s) => {
    const reorder = s.reorderLevel ?? s.product.reorderLevel ?? 0;
    return s.quantityOnHand > 0 && s.quantityOnHand <= reorder;
  }).length;

  const columns: ColumnDef<StockLevel>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm text-gray-900">
            {row.original.product.name}
          </p>
          {row.original.product.unitOfMeasure && (
            <p className="text-xs text-gray-400">
              {row.original.product.unitOfMeasure}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'sku',
      header: 'SKU',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
          {row.original.product.sku}
        </span>
      ),
    },
    {
      id: 'branch',
      header: 'Branch',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.branch.name}</span>
      ),
    },
    {
      id: 'quantityOnHand',
      header: 'Qty on Hand',
      cell: ({ row }) => {
        const qty = row.original.quantityOnHand;
        const reorder =
          row.original.reorderLevel ?? row.original.product.reorderLevel ?? 0;
        const status = getStockStatus(qty, reorder);
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-sm font-bold',
                status === 'OUT_OF_STOCK'
                  ? 'text-red-600'
                  : status === 'LOW_STOCK'
                  ? 'text-amber-600'
                  : 'text-gray-800'
              )}
            >
              {qty}
            </span>
            {status === 'OUT_OF_STOCK' && (
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            )}
            {status === 'LOW_STOCK' && (
              <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
            )}
          </div>
        );
      },
    },
    {
      id: 'quantityReserved',
      header: 'Qty Reserved',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.quantityReserved ?? 0}
        </span>
      ),
    },
    {
      id: 'reorderLevel',
      header: 'Reorder Level',
      cell: ({ row }) => {
        const reorder =
          row.original.reorderLevel ?? row.original.product.reorderLevel ?? 0;
        return (
          <span className="text-sm text-gray-500">{reorder}</span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const reorder =
          row.original.reorderLevel ?? row.original.product.reorderLevel ?? 0;
        const status = getStockStatus(row.original.quantityOnHand, reorder);
        return <StockStatusBadge status={status} />;
      },
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3 w-full">
      <SearchInput
        placeholder="Search by product or SKU..."
        onSearch={handleSearch}
        className="w-64"
      />
      <Select value={branchId} onValueChange={setBranchId}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All Branches" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="ml-auto flex items-center gap-3 text-sm">
        {outOfStock > 0 && (
          <span className="flex items-center gap-1 text-red-600 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            {outOfStock} out of stock
          </span>
        )}
        {lowStock > 0 && (
          <span className="flex items-center gap-1 text-amber-600 font-medium">
            <TrendingDown className="h-3.5 w-3.5" />
            {lowStock} low stock
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Current stock levels across branches"
      />

      <DataTable
        data={filteredStock}
        columns={columns}
        isLoading={isLoading}
        toolbar={toolbar}
      />
    </div>
  );
}

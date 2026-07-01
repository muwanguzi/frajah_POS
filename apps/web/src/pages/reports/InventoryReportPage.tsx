import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Download, Package } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { reportsService } from '@/services/reports.service';
import { formatUGX } from '@/lib/currency';

interface StockLevel {
  productId: string;
  productName: string;
  branchId: string;
  quantityOnHand: number;
  quantityReserved: number;
  totalValue: number;
}

interface InventoryReport {
  stockLevels?: StockLevel[];
  totalItems?: number;
  totalValue?: number;
}

export default function InventoryReportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: () => reportsService.getInventoryReport({}),
    retry: false,
  });

  const report = data as InventoryReport | undefined;
  const stockLevels = report?.stockLevels ?? [];
  const totalValue = report?.totalValue ?? stockLevels.reduce((s, l) => s + (l.totalValue ?? 0), 0);

  const columns: ColumnDef<StockLevel>[] = [
    {
      header: '#',
      cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>,
      size: 40,
    },
    {
      header: 'Product',
      cell: ({ row }) => <span className="font-medium text-sm">{row.original.productName}</span>,
    },
    {
      header: 'Qty on Hand',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{Number(row.original.quantityOnHand).toFixed(2)}</span>
      ),
    },
    {
      header: 'Qty Reserved',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-gray-500">
          {Number(row.original.quantityReserved).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Available',
      cell: ({ row }) => {
        const available = Number(row.original.quantityOnHand) - Number(row.original.quantityReserved);
        return (
          <span className={`font-mono text-sm font-semibold ${available <= 0 ? 'text-red-600' : 'text-green-700'}`}>
            {available.toFixed(2)}
          </span>
        );
      },
    },
    {
      header: 'Stock Value (UGX)',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm">
          {formatUGX(Number(row.original.totalValue ?? 0))}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory Report"
        subtitle="Current stock levels and valuation"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          title="Total Products"
          value={String(stockLevels.length)}
          icon={Package}
        />
        <StatCard
          title="Total Inventory Value"
          value={isLoading ? '...' : formatUGX(totalValue)}
          icon={Package}
          trend="up"
        />
      </div>

      <DataTable data={stockLevels} columns={columns} isLoading={isLoading} />
    </div>
  );
}

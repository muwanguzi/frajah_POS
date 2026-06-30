import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Download, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { reportsService } from '@/services/reports.service';
import { formatUGX } from '@/lib/currency';

interface ExpenseCategory {
  name: string;
  total: number;
  count: number;
}

export default function ExpensesReportPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(firstOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['report-expenses', startDate, endDate],
    queryFn: () => reportsService.getExpensesReport({ startDate, endDate }),
    retry: false,
  });

  const report = data as { totalExpenses?: number; byCategory?: ExpenseCategory[] } | undefined;
  const categories: ExpenseCategory[] = report?.byCategory || [];
  const totalExpenses = report?.totalExpenses || 0;

  const columns: ColumnDef<ExpenseCategory>[] = [
    { header: '#', cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>, size: 40 },
    {
      header: 'Category',
      cell: ({ row }) => <span className="font-medium text-sm">{row.original.name}</span>,
    },
    {
      header: 'Transactions',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.count}</span>,
    },
    {
      header: 'Total (UGX)',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold">{formatUGX(row.original.total)}</span>
      ),
    },
    {
      header: '% of Total',
      cell: ({ row }) => {
        const pct = totalExpenses > 0 ? (row.original.total / totalExpenses) * 100 : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Expense Report"
        subtitle="Expense breakdown by category and period"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="flex items-end gap-3 mb-6">
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          title="Total Expenses"
          value={formatUGX(totalExpenses)}
          icon={Receipt}
          trend="down"
        />
        <StatCard
          title="Categories"
          value={String(categories.length)}
          icon={Receipt}
        />
      </div>

      <DataTable data={categories} columns={columns} isLoading={isLoading} />
    </div>
  );
}

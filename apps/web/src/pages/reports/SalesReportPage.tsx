import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Download, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { reportsService } from '@/services/reports.service';
import { formatUGX } from '@/lib/currency';

type Period = 'today' | 'week' | 'month' | 'custom';

interface TopProduct {
  productId: string;
  productName: string;
  totalQty: string;
  totalRevenue: string;
}

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  if (period === 'today') return { startDate: fmt(today), endDate: fmt(today) };
  if (period === 'week') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { startDate: fmt(start), endDate: fmt(today) };
  }
  if (period === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: fmt(start), endDate: fmt(today) };
  }
  return { startDate: fmt(today), endDate: fmt(today) };
}

export default function SalesReportPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateRange =
    period === 'custom'
      ? { startDate: customStart, endDate: customEnd }
      : getDateRange(period);

  const { data: report, isLoading } = useQuery({
    queryKey: ['sales-report', dateRange],
    queryFn: () => reportsService.getSalesReport(dateRange),
    retry: false,
    enabled: period !== 'custom' || (!!customStart && !!customEnd),
  });

  const metrics = report as Record<string, unknown> | undefined;
  const totalSales       = Number(metrics?.totalSales       ?? 0);
  const totalTransactions = Number(metrics?.totalTransactions ?? 0);
  const averageOrderValue = Number(metrics?.averageOrderValue ?? 0);
  const grossProfit      = Number(metrics?.grossProfit      ?? 0);
  const totalTax         = Number(metrics?.totalTax         ?? 0);
  const totalDiscount    = Number(metrics?.totalDiscount    ?? 0);
  const topProducts      = (metrics?.topProducts as TopProduct[]) ?? [];

  const grossMarginPct = totalSales > 0
    ? ((grossProfit / totalSales) * 100).toFixed(1)
    : '0';

  return (
    <div>
      <PageHeader
        title="Sales Report"
        subtitle="Comprehensive sales analytics"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex items-end gap-4 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Period</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {period === 'custom' && (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Start Date</Label>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">End Date</Label>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-40"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            {dateRange.startDate} → {dateRange.endDate}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Sales"
          value={isLoading ? '...' : formatUGX(totalSales)}
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Transactions"
          value={isLoading ? '...' : String(totalTransactions)}
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Order Value"
          value={isLoading ? '...' : formatUGX(averageOrderValue)}
          icon={TrendingUp}
        />
        <StatCard
          title="Gross Profit"
          value={isLoading ? '...' : formatUGX(grossProfit)}
          icon={TrendingUp}
          trend={grossProfit >= 0 ? 'up' : 'down'}
          trendValue={`${grossMarginPct}% margin`}
        />
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Tax Collected</span>
            <span className="font-mono font-semibold text-sm">{isLoading ? '...' : formatUGX(totalTax)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Discounts Given</span>
            <span className="font-mono font-semibold text-sm text-orange-600">
              {isLoading ? '...' : formatUGX(totalDiscount)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
          ) : topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No sales data for the selected period
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left py-2 font-medium">#</th>
                  <th className="text-left py-2 font-medium">Product</th>
                  <th className="text-right py-2 font-medium">Qty Sold</th>
                  <th className="text-right py-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.productId} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 text-gray-400">{i + 1}</td>
                    <td className="py-2.5 font-medium text-gray-800">{p.productName}</td>
                    <td className="py-2.5 text-right font-mono text-gray-700">
                      {Number(p.totalQty).toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-gray-900">
                      {formatUGX(Number(p.totalRevenue))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

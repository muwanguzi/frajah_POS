import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { reportsService } from '@/services/reports.service';
import { formatUGX } from '@/lib/currency';

export default function ProfitLossPage() {
  const thisMonth = new Date();
  const [startDate, setStartDate] = useState(
    new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(thisMonth.toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['profit-loss', startDate, endDate],
    queryFn: () => reportsService.getProfitLossReport({ startDate, endDate }),
    retry: false,
  });

  const report = data as Record<string, number> | undefined;

  const revenue          = Number(report?.revenue          ?? 0);
  const cogs             = Number(report?.costOfGoodsSold  ?? 0);
  const grossProfit      = Number(report?.grossProfit      ?? 0);
  const operatingExpenses = Number(report?.operatingExpenses ?? 0);
  const netProfit        = Number(report?.netProfit        ?? 0);
  const grossMarginPct   = Number(report?.grossMarginPct   ?? 0);
  const netMarginPct     = Number(report?.netMarginPct     ?? 0);
  const taxCollected     = Number(report?.taxCollected     ?? 0);
  const discounts        = Number(report?.discounts        ?? 0);

  const rows = [
    { label: 'Revenue',               value: revenue,            indent: false, bold: false },
    { label: 'Discounts Given',        value: -discounts,         indent: true,  bold: false },
    { label: 'Tax Collected',          value: taxCollected,       indent: true,  bold: false },
    { label: 'Net Revenue',            value: revenue - discounts, indent: false, bold: false },
    { label: 'Cost of Goods Sold',     value: -cogs,              indent: true,  bold: false },
    { label: 'Gross Profit',           value: grossProfit,        indent: false, bold: true  },
    { label: 'Operating Expenses',     value: -operatingExpenses, indent: true,  bold: false },
    { label: 'Net Profit',             value: netProfit,          indent: false, bold: true  },
  ];

  return (
    <div>
      <PageHeader
        title="Profit & Loss"
        subtitle="Revenue, COGS, and net profit"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        }
      />

      {/* Date Range */}
      <div className="flex items-end gap-4 mb-6">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">From</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">To</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Revenue"
          value={isLoading ? '...' : formatUGX(revenue)}
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Gross Profit"
          value={isLoading ? '...' : formatUGX(grossProfit)}
          icon={TrendingUp}
          trend={grossProfit >= 0 ? 'up' : 'down'}
          trendValue={`${grossMarginPct.toFixed(1)}% margin`}
        />
        <StatCard
          title="Operating Expenses"
          value={isLoading ? '...' : formatUGX(operatingExpenses)}
          icon={TrendingUp}
          trend="down"
        />
        <StatCard
          title="Net Profit"
          value={isLoading ? '...' : formatUGX(netProfit)}
          icon={TrendingUp}
          trend={netProfit >= 0 ? 'up' : 'down'}
          trendValue={`${netMarginPct.toFixed(1)}% margin`}
        />
      </div>

      {/* Income Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Income Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            {rows.map((row) => (
              <div
                key={row.label}
                className={`flex justify-between py-2 ${
                  row.bold ? 'border-t border-gray-200 font-semibold mt-1' : 'text-gray-600'
                }`}
              >
                <span className={row.indent ? 'ml-5 text-gray-500' : ''}>{row.label}</span>
                <span
                  className={`font-mono ${
                    row.value < 0
                      ? 'text-red-600'
                      : row.value > 0 && row.bold
                      ? 'text-green-700'
                      : ''
                  }`}
                >
                  {row.value < 0
                    ? `(${formatUGX(Math.abs(row.value))})`
                    : formatUGX(row.value)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

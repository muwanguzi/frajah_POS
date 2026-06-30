import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, BarChart3 } from 'lucide-react';
import { formatUGX } from '@/lib/currency';
import apiClient from '@/lib/api-client';

export default function VATReportPage() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = today.toISOString().split('T')[0];

  const { data } = useQuery({
    queryKey: ['vat-report'],
    queryFn: () => apiClient.get('/reports/vat', { params: { startDate: startOfMonth, endDate: endOfMonth } }),
    retry: false,
  });

  const report = data as Record<string, unknown> | undefined;

  return (
    <div>
      <PageHeader
        title="VAT Report"
        subtitle={`${startOfMonth} — ${endOfMonth} | VAT Rate: 18%`}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export URA Format
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="VAT Collected (Output)" value={formatUGX(Number(report?.vatCollected ?? 0))} icon={BarChart3} trend="up" />
        <StatCard title="VAT Paid (Input)" value={formatUGX(Number(report?.vatPaid ?? 0))} icon={BarChart3} />
        <StatCard title="Net VAT Payable" value={formatUGX(Number(report?.netVat ?? 0))} icon={BarChart3} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">VAT Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Standard Rated Sales (18%)</span>
              <span className="font-mono">{formatUGX(0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">VAT on Sales</span>
              <span className="font-mono text-green-600">+{formatUGX(0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">VAT on Purchases</span>
              <span className="font-mono text-red-600">-{formatUGX(0)}</span>
            </div>
            <div className="flex justify-between py-2 font-semibold">
              <span>Net VAT Payable to URA</span>
              <span className="font-mono text-blue-700">{formatUGX(0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

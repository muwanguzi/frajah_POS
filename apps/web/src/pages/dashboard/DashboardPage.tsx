import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  BarChart2,
  Calendar,
  Banknote,
  Building,
  Package,
  AlertTriangle,
  Bell,
  ShoppingCart,
  FileText,
  Users,
  PlusCircle,
  Download,
  RefreshCw,
  BarChart3,
  Boxes,
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { SalesLineChart } from '@/components/charts/SalesLineChart';
import { RevenueBarChart } from '@/components/charts/RevenueBarChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';
import { dashboardService } from '@/services/dashboard.service';
import { formatUGX } from '@/lib/currency';
import { useNavigate } from 'react-router-dom';

interface Metrics {
  salesToday: number;
  salesWeekly: number;
  salesMonthly: number;
  salesAnnual: number;
  grossProfit: number;
  netProfit: number;
  cashAvailable: number;
  bankBalance: number;
  inventoryValue: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingOrders: number;
}

interface Alert {
  type: string;
  severity: string;
  message: string;
  count: number;
}

interface SalesChartResponse {
  labels: string[];
  data: number[];
}

const ALERT_ICONS: Record<string, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  OUT_OF_STOCK:    { icon: Package,       color: 'text-red-500',    bg: 'bg-red-50' },
  LOW_STOCK:       { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  PENDING_PO:      { icon: FileText,      color: 'text-blue-500',   bg: 'bg-blue-50' },
  PENDING_EXPENSE: { icon: Bell,          color: 'text-purple-500', bg: 'bg-purple-50' },
};

const quickActions = [
  { label: 'New Sale',     icon: ShoppingCart, href: '/pos',             color: 'bg-blue-600' },
  { label: 'New Invoice',  icon: FileText,     href: '/sales/invoices',  color: 'bg-green-600' },
  { label: 'Add Product',  icon: PlusCircle,   href: '/products/new',    color: 'bg-purple-600' },
  { label: 'Add Customer', icon: Users,        href: '/customers',       color: 'bg-orange-600' },
  { label: 'Stock Report', icon: BarChart3,    href: '/reports/inventory', color: 'bg-teal-600' },
  { label: 'Export Data',  icon: Download,     href: '/reports',         color: 'bg-gray-600' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data: metrics, isLoading } = useQuery<Metrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: () => dashboardService.getMetrics() as Promise<Metrics>,
    retry: false,
    staleTime: 60_000,
  });

  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ['dashboard-alerts'],
    queryFn: () => dashboardService.getAlerts() as Promise<Alert[]>,
    retry: false,
    staleTime: 60_000,
  });

  const { data: salesChart } = useQuery<SalesChartResponse>({
    queryKey: ['dashboard-sales-chart', 'month'],
    queryFn: () => dashboardService.getSalesChart('month') as Promise<SalesChartResponse>,
    retry: false,
    staleTime: 300_000,
  });

  const { data: yearChart } = useQuery<SalesChartResponse>({
    queryKey: ['dashboard-sales-chart', 'year'],
    queryFn: () => dashboardService.getSalesChart('year') as Promise<SalesChartResponse>,
    retry: false,
    staleTime: 300_000,
  });

  const salesChartData = salesChart?.labels.map((date, i) => ({
    date,
    amount: salesChart.data[i] ?? 0,
  })) ?? [];

  const grossMarginPct = metrics?.salesMonthly
    ? Math.round(((metrics.grossProfit ?? 0) / metrics.salesMonthly) * 100)
    : 0;

  const revenueBarData = yearChart?.labels.map((label, i) => {
    const revenue = yearChart.data[i] ?? 0;
    const costRatio = metrics?.salesMonthly
      ? ((metrics.salesMonthly - (metrics.grossProfit ?? 0)) / metrics.salesMonthly)
      : 0.6;
    return { label, revenue, cost: Math.round(revenue * costRatio) };
  }) ?? [];

  const StatSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-sales-chart', 'month'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-sales-chart', 'year'] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.firstName || 'there'}!`}
        subtitle={format(now, "EEEE, MMMM d, yyyy")}
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Sales KPIs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Sales Performance
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                title="Today's Sales"
                value={formatUGX(metrics?.salesToday ?? 0)}
                subtitle="transactions today"
                icon={DollarSign}
                iconColor="bg-blue-600"
              />
              <StatCard
                title="Weekly Sales"
                value={formatUGX(metrics?.salesWeekly ?? 0)}
                subtitle="this week"
                icon={TrendingUp}
                iconColor="bg-green-600"
              />
              <StatCard
                title="Monthly Sales"
                value={formatUGX(metrics?.salesMonthly ?? 0)}
                subtitle={format(now, 'MMMM yyyy')}
                icon={BarChart2}
                iconColor="bg-purple-600"
              />
              <StatCard
                title="Annual Sales"
                value={formatUGX(metrics?.salesAnnual ?? 0)}
                subtitle={format(now, 'yyyy')}
                icon={Calendar}
                iconColor="bg-orange-600"
              />
            </>
          )}
        </div>
      </div>

      {/* Profit & Cash */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Gross Profit"
              value={formatUGX(metrics?.grossProfit ?? 0)}
              subtitle={`Margin: ${grossMarginPct}%`}
              icon={TrendingUp}
              iconColor="bg-green-600"
            />
            <StatCard
              title="Net Profit"
              value={formatUGX(metrics?.netProfit ?? 0)}
              subtitle="After expenses"
              icon={TrendingUp}
              iconColor="bg-teal-600"
            />
            <StatCard
              title="Cash Available"
              value={formatUGX(metrics?.cashAvailable ?? 0)}
              subtitle="All cash tills"
              icon={Banknote}
              iconColor="bg-blue-600"
            />
            <StatCard
              title="Bank Balance"
              value={formatUGX(metrics?.bankBalance ?? 0)}
              subtitle="All accounts"
              icon={Building}
              iconColor="bg-slate-600"
            />
          </>
        )}
      </div>

      {/* Inventory Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Inventory Summary
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                title="Inventory Value"
                value={formatUGX(metrics?.inventoryValue ?? 0)}
                subtitle="At cost price"
                icon={Boxes}
                iconColor="bg-indigo-600"
              />
              <StatCard
                title="Total Products"
                value={String(metrics?.totalProducts ?? 0)}
                subtitle="Active SKUs"
                icon={Package}
                iconColor="bg-blue-500"
              />
              <StatCard
                title="Low Stock Items"
                value={String(metrics?.lowStockCount ?? 0)}
                subtitle="Below reorder level"
                icon={AlertTriangle}
                iconColor="bg-orange-500"
              />
              <StatCard
                title="Out of Stock"
                value={String(metrics?.outOfStockCount ?? 0)}
                subtitle="Zero quantity items"
                icon={Package}
                iconColor="bg-red-500"
              />
            </>
          )}
        </div>
      </div>

      {/* Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-500" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No alerts at this time</p>
            ) : (
              alerts.map((alert) => {
                const cfg = ALERT_ICONS[alert.type] ?? ALERT_ICONS.LOW_STOCK;
                const Icon = cfg.icon;
                return (
                  <div
                    key={alert.type}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${cfg.bg}`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <span className="flex-1 text-sm text-gray-700">{alert.message}</span>
                    <Badge
                      variant="secondary"
                      className={`font-mono ${alert.severity === 'critical' ? 'bg-red-100 text-red-700' : ''}`}
                    >
                      {alert.count}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.href)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-gray-300 hover:shadow-sm transition-all group"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales Trend — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesLineChart data={salesChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue vs Cost — Last 12 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueBarChart data={revenueBarData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

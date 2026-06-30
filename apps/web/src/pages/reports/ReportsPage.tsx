import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Package, PieChart, ChevronRight, Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const reports = [
  {
    title: 'Sales Report',
    description: 'Daily, weekly, and monthly sales summaries with trends',
    icon: TrendingUp,
    path: '/reports/sales',
    color: 'bg-blue-50 text-blue-600',
    badge: 'Daily',
  },
  {
    title: 'Inventory Report',
    description: 'Stock levels, valuation, and movement history',
    icon: Package,
    path: '/reports/inventory',
    color: 'bg-green-50 text-green-600',
    badge: 'Real-time',
  },
  {
    title: 'Profit & Loss',
    description: 'Revenue, COGS, gross profit, expenses, and net profit',
    icon: BarChart3,
    path: '/reports/profit-loss',
    color: 'bg-purple-50 text-purple-600',
    badge: 'Monthly',
  },
  {
    title: 'Expense Report',
    description: 'Expense breakdown by category and approval status',
    icon: PieChart,
    path: '/reports/expenses',
    color: 'bg-orange-50 text-orange-600',
    badge: 'Monthly',
  },
];

export default function ReportsPage() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Business analytics and reporting"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {reports.map((report) => (
          <Card
            key={report.path}
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate(report.path)}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${report.color}`}>
                <report.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {report.title}
                  </h3>
                  <Badge variant="outline" className="text-xs">{report.badge}</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{report.description}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Download className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        All reports support PDF and CSV export. VAT reports comply with URA standards.
      </p>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, CreditCard, BarChart3, ChevronRight, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

const modules = [
  {
    title: 'General Ledger',
    description: 'View all journal entries and account balances',
    icon: BookOpen,
    path: '/accounting/ledger',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Cashbook',
    description: 'Track cash inflows and outflows',
    icon: DollarSign,
    path: '/accounting/cashbook',
    color: 'bg-green-50 text-green-600',
  },
  {
    title: 'Bank Reconciliation',
    description: 'Reconcile bank statements with cashbook',
    icon: CreditCard,
    path: '/accounting/reconciliation',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'VAT Report',
    description: 'View VAT collected and payable (18%)',
    icon: BarChart3,
    path: '/accounting/vat',
    color: 'bg-orange-50 text-orange-600',
  },
];

export default function AccountingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Accounting"
        subtitle="Financial management and reporting"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {modules.map((mod) => (
          <Card
            key={mod.path}
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate(mod.path)}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${mod.color}`}>
                <mod.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{mod.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

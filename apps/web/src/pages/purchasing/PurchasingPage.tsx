import { useNavigate } from 'react-router-dom';
import { ShoppingBag, FileText, PackageCheck, Layers, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

const modules = [
  {
    title: 'Purchase Orders',
    description: 'Create and manage purchase orders to suppliers',
    icon: FileText,
    path: '/purchasing/orders',
    color: 'bg-blue-50 text-blue-600',
    action: 'View Orders',
  },
  {
    title: 'Goods Receipts',
    description: 'Receive goods and create inventory batches',
    icon: PackageCheck,
    path: '/purchasing/receipts',
    color: 'bg-green-50 text-green-600',
    action: 'Receive Goods',
  },
  {
    title: 'Product Batches',
    description: 'View and manage inventory batches (FIFO/LIFO/WAC)',
    icon: Layers,
    path: '/purchasing/batches',
    color: 'bg-purple-50 text-purple-600',
    action: 'View Batches',
  },
];

export default function PurchasingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Purchasing"
        subtitle="Supplier orders, goods receipt, and batch inventory management"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        {modules.map((mod) => (
          <Card
            key={mod.path}
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate(mod.path)}
          >
            <CardContent className="p-6">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${mod.color}`}>
                <mod.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {mod.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{mod.description}</p>
              <div className="flex items-center gap-1 text-blue-600 text-sm mt-4 font-medium">
                {mod.action}
                <ChevronRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

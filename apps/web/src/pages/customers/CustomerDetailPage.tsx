import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, MapPin, Star, ShoppingBag, CreditCard } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUGX } from '@/lib/currency';
import apiClient from '@/lib/api-client';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  customerType?: string;
  creditLimit?: string | number;
  loyaltyPoints?: number;
  storeCredit?: string | number;
  discountPct?: number;
  createdAt: string;
}

interface SaleHistory {
  id: string;
  saleNumber?: string;
  total: string | number;
  status: string;
  createdAt: string;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: () => apiClient.get(`/customers/${id}`) as Promise<Customer>,
    enabled: !!id,
  });

  const { data: sales = [] } = useQuery<SaleHistory[]>({
    queryKey: ['customer-sales', id],
    queryFn: () => apiClient.get(`/customers/${id}/sales`) as Promise<SaleHistory[]>,
    enabled: !!id,
    retry: false,
  });

  const saleColumns: ColumnDef<SaleHistory>[] = [
    {
      header: 'Sale #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-blue-600">{row.original.saleNumber || row.original.id.slice(0, 8)}</span>
      ),
    },
    {
      header: 'Total',
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatUGX(Number(row.original.total ?? 0))}</span>,
    },
    {
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">{new Date(row.original.createdAt).toLocaleDateString('en-UG')}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Customer not found</p>
        <Button variant="ghost" onClick={() => navigate('/customers')} className="mt-2">Back to Customers</Button>
      </div>
    );
  }

  const typeColor: Record<string, string> = {
    RETAIL: 'bg-blue-100 text-blue-700',
    WHOLESALE: 'bg-purple-100 text-purple-700',
    CORPORATE: 'bg-amber-100 text-amber-700',
  };

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={`Customer since ${new Date(customer.createdAt).toLocaleDateString('en-UG')}`}
        actions={
          <Button variant="outline" className="gap-1.5" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Contact Info
              {customer.customerType && (
                <Badge className={typeColor[customer.customerType] || 'bg-gray-100 text-gray-600'}>
                  {customer.customerType}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />{customer.phone}
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />{customer.email}
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />{customer.address}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loyalty & Credit */}
        <Card>
          <CardHeader><CardTitle className="text-base">Loyalty & Credit</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Star className="h-4 w-4 text-yellow-500" />Loyalty Points
              </div>
              <span className="font-semibold text-yellow-600">{customer.loyaltyPoints ?? 0} pts</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CreditCard className="h-4 w-4 text-green-500" />Store Credit
              </div>
              <span className="font-semibold text-green-600">{formatUGX(Number(customer.storeCredit ?? 0))}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CreditCard className="h-4 w-4 text-blue-500" />Credit Limit
              </div>
              <span className="font-semibold">{formatUGX(Number(customer.creditLimit ?? 0))}</span>
            </div>
            {customer.discountPct != null && customer.discountPct > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Default Discount</span>
                <span className="font-semibold text-purple-600">{customer.discountPct}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchase summary */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Purchase Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Orders</span>
              <span className="font-semibold">{sales.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Spent</span>
              <span className="font-semibold text-green-600">
                {formatUGX(sales.reduce((s, x) => s + Number(x.total ?? 0), 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Last Purchase</span>
              <span className="text-sm text-gray-600">
                {sales.length > 0
                  ? new Date(sales[0].createdAt).toLocaleDateString('en-UG')
                  : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase history */}
      <div className="mt-6">
        <h3 className="text-base font-semibold mb-3">Purchase History</h3>
        <DataTable data={sales} columns={saleColumns} isLoading={false} />
      </div>
    </div>
  );
}

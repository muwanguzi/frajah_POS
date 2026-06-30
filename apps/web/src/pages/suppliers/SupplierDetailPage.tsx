import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, MapPin, Star, Package2, AlertCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUGX } from '@/lib/currency';
import apiClient from '@/lib/api-client';

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  rating?: number;
  outstandingBalance?: string | number;
  createdAt: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount?: string | number;
  orderDate?: string;
  createdAt: string;
}

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: supplier, isLoading } = useQuery<Supplier>({
    queryKey: ['supplier', id],
    queryFn: () => apiClient.get(`/suppliers/${id}`) as Promise<Supplier>,
    enabled: !!id,
  });

  const { data: orders = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ['supplier-orders', id],
    queryFn: () => apiClient.get(`/suppliers/${id}/orders`) as Promise<PurchaseOrder[]>,
    enabled: !!id,
    retry: false,
  });

  const poColumns: ColumnDef<PurchaseOrder>[] = [
    {
      header: 'PO #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-blue-600">{row.original.poNumber}</span>
      ),
    },
    {
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">{formatUGX(Number(row.original.totalAmount ?? 0))}</span>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: 'Order Date',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">
          {row.original.orderDate ? new Date(row.original.orderDate).toLocaleDateString('en-UG') : '—'}
        </span>
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

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Supplier not found</p>
        <Button variant="ghost" onClick={() => navigate('/suppliers')} className="mt-2">Back to Suppliers</Button>
      </div>
    );
  }

  const outstanding = Number(supplier.outstandingBalance ?? 0);

  return (
    <div>
      <PageHeader
        title={supplier.name}
        subtitle={supplier.contactPerson ? `Contact: ${supplier.contactPerson}` : 'Supplier profile'}
        actions={
          <Button variant="outline" className="gap-1.5" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact */}
        <Card>
          <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {supplier.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />{supplier.phone}
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />{supplier.email}
              </div>
            )}
            {supplier.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />{supplier.address}
              </div>
            )}
            {supplier.taxNumber && (
              <div className="text-sm text-gray-600">
                <span className="text-gray-400">TIN: </span>{supplier.taxNumber}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating & Balance */}
        <Card>
          <CardHeader><CardTitle className="text-base">Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Star className="h-4 w-4 text-yellow-500" />Rating
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < (supplier.rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <AlertCircle className="h-4 w-4 text-red-500" />Outstanding Balance
              </div>
              <span className={`font-semibold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatUGX(outstanding)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package2 className="h-4 w-4" />Order Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Orders</span>
              <span className="font-semibold">{orders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Purchased</span>
              <span className="font-semibold text-blue-600">
                {formatUGX(orders.reduce((s, o) => s + Number(o.totalAmount ?? 0), 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Last Order</span>
              <span className="text-sm text-gray-600">
                {orders.length > 0
                  ? new Date(orders[0].createdAt).toLocaleDateString('en-UG')
                  : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase orders */}
      <div className="mt-6">
        <h3 className="text-base font-semibold mb-3">Purchase Orders</h3>
        <DataTable data={orders} columns={poColumns} isLoading={false} />
      </div>
    </div>
  );
}

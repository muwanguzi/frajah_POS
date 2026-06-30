import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { FileText, Download, Eye } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatUGX } from '@/lib/currency';
import apiClient from '@/lib/api-client';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer?: { id: string; name: string };
  status: string;
  total?: string | number;
  dueDate?: string;
  issueDate?: string;
  createdAt: string;
}

export default function InvoicesPage() {
  const [status, setStatus] = useState('all');

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', status],
    queryFn: () =>
      apiClient.get('/sales/invoices', { params: status !== 'all' ? { status } : {} }) as Promise<Invoice[]>,
    retry: false,
  });

  const columns: ColumnDef<Invoice>[] = [
    { header: '#', cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>, size: 40 },
    {
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-blue-600 font-medium">{row.original.invoiceNumber}</span>
      ),
    },
    {
      header: 'Customer',
      cell: ({ row }) => <span className="text-sm">{row.original.customer?.name || '—'}</span>,
    },
    {
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold">{formatUGX(Number(row.original.total ?? 0))}</span>
      ),
    },
    {
      header: 'Issue Date',
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">
          {row.original.issueDate ? new Date(row.original.issueDate).toLocaleDateString('en-UG') : '—'}
        </span>
      ),
    },
    {
      header: 'Due Date',
      cell: ({ row }) => {
        const due = row.original.dueDate ? new Date(row.original.dueDate) : null;
        const overdue = due && due < new Date() && row.original.status !== 'PAID';
        return (
          <span className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
            {due ? due.toLocaleDateString('en-UG') : '—'}
            {overdue && ' (Overdue)'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: () => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Manage customer invoices and payment tracking"
        actions={
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-1.5"><FileText className="h-4 w-4" /> New Invoice</Button>
          </div>
        }
      />
      <DataTable data={invoices} columns={columns} isLoading={isLoading} />
    </div>
  );
}

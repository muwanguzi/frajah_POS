import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatUGX } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

interface Quote {
  id: string;
  quoteNumber: string;
  customer?: { id: string; name: string };
  status: string;
  total?: string | number;
  validUntil?: string;
  createdAt: string;
}

export default function QuotesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ['quotes'],
    queryFn: () => apiClient.get('/sales/quotes') as Promise<Quote[]>,
    retry: false,
  });

  const convertToInvoice = useMutation({
    mutationFn: (id: string) => apiClient.post(`/sales/quotes/${id}/convert`),
    onSuccess: () => {
      toast({ title: 'Quote converted to invoice' });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to convert quote', variant: 'destructive' });
    },
  });

  const cancelQuote = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/sales/quotes/${id}/cancel`),
    onSuccess: () => {
      toast({ title: 'Quote cancelled' });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to cancel quote', variant: 'destructive' });
    },
  });

  const columns: ColumnDef<Quote>[] = [
    { header: '#', cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>, size: 40 },
    {
      header: 'Quote #',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-blue-600 font-medium">{row.original.quoteNumber}</span>
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
      header: 'Valid Until',
      cell: ({ row }) => {
        const valid = row.original.validUntil ? new Date(row.original.validUntil) : null;
        const expired = valid && valid < new Date();
        return (
          <span className={`text-xs font-medium ${expired ? 'text-red-600' : 'text-gray-500'}`}>
            {valid ? valid.toLocaleDateString('en-UG') : '—'}
            {expired && ' (Expired)'}
          </span>
        );
      },
    },
    {
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">{new Date(row.original.createdAt).toLocaleDateString('en-UG')}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const q = row.original;
        if (q.status === 'DRAFT' || q.status === 'SENT') {
          return (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7 text-green-600"
                onClick={() => convertToInvoice.mutate(q.id)}
                title="Convert to Invoice"
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                onClick={() => cancelQuote.mutate(q.id)}
                title="Cancel"
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        }
        return <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Create and manage price quotes for customers"
        actions={
          <Button className="gap-1.5"><Plus className="h-4 w-4" /> New Quote</Button>
        }
      />
      <DataTable data={quotes} columns={columns} isLoading={isLoading} />
    </div>
  );
}

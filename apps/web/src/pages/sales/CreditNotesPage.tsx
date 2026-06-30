import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Eye, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatUGX } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

interface CreditNote {
  id: string;
  noteNumber: string;
  customer?: { id: string; name: string };
  status: string;
  amount: string | number;
  reason?: string;
  createdAt: string;
}

const emptyForm = { customerId: '', amount: '', reason: '', saleId: '' };

export default function CreditNotesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: notes = [], isLoading } = useQuery<CreditNote[]>({
    queryKey: ['credit-notes'],
    queryFn: () => apiClient.get('/sales/credit-notes') as Promise<CreditNote[]>,
    retry: false,
  });

  const createNote = useMutation({
    mutationFn: (data: typeof form) =>
      apiClient.post('/sales/credit-notes', { ...data, amount: Number(data.amount) }),
    onSuccess: () => {
      toast({ title: 'Credit note created' });
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to create credit note', variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    if (!form.customerId || !form.amount || !form.reason) {
      toast({ title: 'Validation', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    createNote.mutate(form);
  };

  const columns: ColumnDef<CreditNote>[] = [
    { header: '#', cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>, size: 40 },
    {
      header: 'Note #',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-blue-600 font-medium">{row.original.noteNumber}</span>
      ),
    },
    {
      header: 'Customer',
      cell: ({ row }) => <span className="text-sm">{row.original.customer?.name || '—'}</span>,
    },
    {
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold text-orange-600">
          {formatUGX(Number(row.original.amount ?? 0))}
        </span>
      ),
    },
    {
      header: 'Reason',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 max-w-xs truncate block">{row.original.reason || '—'}</span>
      ),
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
    {
      id: 'actions',
      cell: () => (
        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Credit Notes"
        subtitle="Manage customer credits and refund authorisations"
        actions={
          <Button className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Credit Note
          </Button>
        }
      />
      <DataTable data={notes} columns={columns} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" /> New Credit Note
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer ID *</Label>
              <Input
                value={form.customerId}
                onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                placeholder="Customer ID"
              />
            </div>
            <div>
              <Label>Related Sale ID (optional)</Label>
              <Input
                value={form.saleId}
                onChange={e => setForm(f => ({ ...f, saleId: e.target.value }))}
                placeholder="Sale ID if applicable"
              />
            </div>
            <div>
              <Label>Amount (UGX) *</Label>
              <Input
                type="number"
                min="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="Credit amount"
              />
            </div>
            <div>
              <Label>Reason *</Label>
              <Input
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Reason for credit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createNote.isPending}>
              {createNote.isPending ? 'Creating...' : 'Create Credit Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

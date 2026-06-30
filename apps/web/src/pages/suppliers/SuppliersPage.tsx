import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, FileText, Loader2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { suppliersService } from '@/services/suppliers.service';
import { formatUGX } from '@/lib/currency';

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  outstandingBalance: number;
  isActive: boolean;
  notes?: string;
}

const emptyForm = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  taxNumber: '',
  notes: '',
};

export default function SuppliersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Edit dialog state
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers', search],
    queryFn: () =>
      suppliersService.findAll({ search: search || undefined }) as Promise<Supplier[]>,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => suppliersService.create(data),
    onSuccess: () => {
      toast.success('Supplier added successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setAddOpen(false);
      setForm({ ...emptyForm });
      setFormErrors({});
    },
    onError: () => {
      toast.error('Failed to add supplier');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      suppliersService.update(id, data),
    onSuccess: () => {
      toast.success('Supplier updated successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setEditSupplier(null);
      setEditErrors({});
    },
    onError: () => {
      toast.error('Failed to update supplier');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersService.remove(id),
    onSuccess: () => {
      toast.success('Supplier deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete supplier');
    },
  });

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  const validateForm = (f: typeof emptyForm) => {
    const errors: Record<string, string> = {};
    if (!f.name.trim()) errors.name = 'Company name is required';
    return errors;
  };

  const handleAddSubmit = () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    createMutation.mutate({
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      taxNumber: form.taxNumber.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  const openEdit = (supplier: Supplier) => {
    setEditSupplier(supplier);
    setEditForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxNumber: supplier.taxNumber || '',
      notes: supplier.notes || '',
    });
    setEditErrors({});
  };

  const handleEditSubmit = () => {
    if (!editSupplier) return;
    const errors = validateForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    updateMutation.mutate({
      id: editSupplier.id,
      data: {
        name: editForm.name.trim(),
        contactPerson: editForm.contactPerson.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        email: editForm.email.trim() || undefined,
        address: editForm.address.trim() || undefined,
        taxNumber: editForm.taxNumber.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      },
    });
  };

  const columns: ColumnDef<Supplier>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Company Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.name}</p>
          {row.original.taxNumber && (
            <p className="text-xs text-gray-400">TIN: {row.original.taxNumber}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'contactPerson',
      header: 'Contact Person',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.contactPerson || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.phone || '—'}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.email || '—'}</span>
      ),
    },
    {
      accessorKey: 'taxNumber',
      header: 'TIN / Tax No.',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-gray-600">
          {row.original.taxNumber || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'outstandingBalance',
      header: 'Outstanding Balance',
      cell: ({ row }) => {
        const balance = row.original.outstandingBalance;
        return (
          <span
            className={`text-sm font-mono font-medium ${
              balance > 0 ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {formatUGX(balance)}
          </span>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
            title="View purchase orders"
            onClick={() => navigate(`/suppliers/${row.original.id}`)}
          >
            <FileText className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Edit supplier"
            onClick={() => openEdit(row.original)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Delete supplier"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <div className="flex items-center gap-3 w-full">
      <SearchInput
        placeholder="Search suppliers..."
        onSearch={handleSearch}
        className="w-72"
      />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle={`${suppliers.length} supplier${suppliers.length !== 1 ? 's' : ''} total`}
        actions={
          <Button
            onClick={() => {
              setForm({ ...emptyForm });
              setFormErrors({});
              setAddOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        }
      />

      <DataTable
        data={suppliers}
        columns={columns}
        isLoading={isLoading}
        toolbar={toolbar}
      />

      {/* Add Supplier Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => { if (!createMutation.isPending) setAddOpen(open); }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Company Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="add-name">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-name"
                placeholder="Supplier or company name"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  if (formErrors.name) setFormErrors((err) => ({ ...err, name: '' }));
                }}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Contact Person */}
            <div className="grid gap-1.5">
              <Label htmlFor="add-contact">Contact Person</Label>
              <Input
                id="add-contact"
                placeholder="Primary contact name"
                value={form.contactPerson}
                onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="add-phone">Phone</Label>
                <Input
                  id="add-phone"
                  placeholder="+256 700 000000"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="email@company.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid gap-1.5">
              <Label htmlFor="add-address">Address</Label>
              <Input
                id="add-address"
                placeholder="Physical address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>

            {/* TIN / Tax Number */}
            <div className="grid gap-1.5">
              <Label htmlFor="add-tax">TIN / Tax Number</Label>
              <Input
                id="add-tax"
                placeholder="Uganda Revenue Authority TIN"
                value={form.taxNumber}
                onChange={(e) => setForm((f) => ({ ...f, taxNumber: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div className="grid gap-1.5">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                placeholder="Optional notes about this supplier..."
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog
        open={!!editSupplier}
        onOpenChange={(open) => { if (!updateMutation.isPending && !open) setEditSupplier(null); }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => {
                  setEditForm((f) => ({ ...f, name: e.target.value }));
                  if (editErrors.name) setEditErrors((err) => ({ ...err, name: '' }));
                }}
              />
              {editErrors.name && (
                <p className="text-xs text-red-500">{editErrors.name}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-contact">Contact Person</Label>
              <Input
                id="edit-contact"
                value={editForm.contactPerson}
                onChange={(e) => setEditForm((f) => ({ ...f, contactPerson: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-tax">TIN / Tax Number</Label>
              <Input
                id="edit-tax"
                value={editForm.taxNumber}
                onChange={(e) => setEditForm((f) => ({ ...f, taxNumber: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditSupplier(null)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Supplier"
        description="Are you sure you want to delete this supplier? This action cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete Supplier"
      />
    </div>
  );
}

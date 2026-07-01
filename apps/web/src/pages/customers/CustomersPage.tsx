import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { customersService } from '@/services/customers.service';
import { formatUGX } from '@/lib/currency';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  customerType: 'RETAIL' | 'WHOLESALE' | 'CORPORATE';
  creditLimit: number;
  loyaltyPoints: number;
  isActive: boolean;
  notes?: string;
}

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  RETAIL: 'Retail',
  WHOLESALE: 'Wholesale',
  CORPORATE: 'Corporate',
};

const CUSTOMER_TYPE_COLORS: Record<string, string> = {
  RETAIL: 'bg-blue-100 text-blue-800 border-blue-200',
  WHOLESALE: 'bg-purple-100 text-purple-800 border-purple-200',
  CORPORATE: 'bg-amber-100 text-amber-800 border-amber-200',
};

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  customerType: 'RETAIL',
  creditLimit: '',
  notes: '',
};

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // View dialog state
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);

  // Edit dialog state
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', search],
    queryFn: () =>
      customersService.findAll({ search: search || undefined }) as Promise<Customer[]>,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => customersService.create(data),
    onSuccess: () => {
      toast.success('Customer added successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setAddOpen(false);
      setForm({ ...emptyForm });
      setFormErrors({});
    },
    onError: () => {
      toast.error('Failed to add customer');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      customersService.update(id, data),
    onSuccess: () => {
      toast.success('Customer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditCustomer(null);
      setEditErrors({});
    },
    onError: () => {
      toast.error('Failed to update customer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersService.remove(id),
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete customer');
    },
  });

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  const validateForm = (f: typeof emptyForm) => {
    const errors: Record<string, string> = {};
    if (!f.name.trim()) errors.name = 'Name is required';
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
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      customerType: form.customerType,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : 0,
      notes: form.notes.trim() || undefined,
    });
  };

  const openEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      customerType: customer.customerType,
      creditLimit: customer.creditLimit > 0 ? String(customer.creditLimit) : '',
      notes: customer.notes || '',
    });
    setEditErrors({});
  };

  const handleEditSubmit = () => {
    if (!editCustomer) return;
    const errors = validateForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    updateMutation.mutate({
      id: editCustomer.id,
      data: {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || undefined,
        email: editForm.email.trim() || undefined,
        address: editForm.address.trim() || undefined,
        customerType: editForm.customerType,
        creditLimit: editForm.creditLimit ? Number(editForm.creditLimit) : 0,
        notes: editForm.notes.trim() || undefined,
      },
    });
  };

  const columns: ColumnDef<Customer>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.name}</p>
          {row.original.phone && (
            <p className="text-xs text-gray-400">{row.original.phone}</p>
          )}
        </div>
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
      accessorKey: 'customerType',
      header: 'Customer Type',
      cell: ({ row }) => {
        const type = row.original.customerType;
        return (
          <Badge
            variant="outline"
            className={CUSTOMER_TYPE_COLORS[type] || 'bg-gray-100 text-gray-700'}
          >
            {CUSTOMER_TYPE_LABELS[type] || type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'creditLimit',
      header: 'Credit Limit',
      cell: ({ row }) => (
        <span className="text-sm font-mono">
          {formatUGX(row.original.creditLimit)}
        </span>
      ),
    },
    {
      accessorKey: 'loyaltyPoints',
      header: 'Loyalty Points',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-amber-600">
          {(row.original.loyaltyPoints ?? 0).toLocaleString()}
        </span>
      ),
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
            className="h-8 w-8"
            title="View details"
            onClick={() => setViewCustomer(row.original)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Edit customer"
            onClick={() => openEdit(row.original)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Delete customer"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3 w-full">
      <SearchInput
        placeholder="Search by name or phone..."
        onSearch={handleSearch}
        className="w-72"
      />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customer${customers.length !== 1 ? 's' : ''} total`}
        actions={
          <Button onClick={() => { setForm({ ...emptyForm }); setFormErrors({}); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      <DataTable
        data={customers}
        columns={columns}
        isLoading={isLoading}
        toolbar={toolbar}
      />

      {/* Add Customer Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { if (!createMutation.isPending) setAddOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="add-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-name"
                placeholder="Full name or business name"
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

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  placeholder="email@example.com"
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

            {/* Customer Type & Credit Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="add-type">Customer Type</Label>
                <Select
                  value={form.customerType}
                  onValueChange={(val) => setForm((f) => ({ ...f, customerType: val }))}
                >
                  <SelectTrigger id="add-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                    <SelectItem value="CORPORATE">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="add-credit">Credit Limit (UGX)</Label>
                <Input
                  id="add-credit"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.creditLimit}
                  onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-1.5">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                placeholder="Optional notes about this customer..."
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
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog
        open={!!editCustomer}
        onOpenChange={(open) => { if (!updateMutation.isPending && !open) setEditCustomer(null); }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">
                Name <span className="text-red-500">*</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-type">Customer Type</Label>
                <Select
                  value={editForm.customerType}
                  onValueChange={(val) => setEditForm((f) => ({ ...f, customerType: val }))}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                    <SelectItem value="CORPORATE">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-credit">Credit Limit (UGX)</Label>
                <Input
                  id="edit-credit"
                  type="number"
                  min="0"
                  value={editForm.creditLimit}
                  onChange={(e) => setEditForm((f) => ({ ...f, creditLimit: e.target.value }))}
                />
              </div>
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
              onClick={() => setEditCustomer(null)}
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

      {/* View Customer Dialog */}
      <Dialog open={!!viewCustomer} onOpenChange={(open) => !open && setViewCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <DialogTitle>{viewCustomer?.name}</DialogTitle>
            </div>
          </DialogHeader>

          {viewCustomer && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={viewCustomer.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Customer Type</span>
                <Badge
                  variant="outline"
                  className={CUSTOMER_TYPE_COLORS[viewCustomer.customerType]}
                >
                  {CUSTOMER_TYPE_LABELS[viewCustomer.customerType]}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{viewCustomer.phone || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{viewCustomer.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-right max-w-[60%]">
                  {viewCustomer.address || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Credit Limit</span>
                <span className="font-mono font-medium">
                  {formatUGX(viewCustomer.creditLimit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Loyalty Points</span>
                <span className="font-semibold text-amber-600">
                  {(viewCustomer.loyaltyPoints ?? 0).toLocaleString()} pts
                </span>
              </div>
              {viewCustomer.notes && (
                <div className="pt-2 border-t">
                  <p className="text-gray-500 mb-1">Notes</p>
                  <p className="text-gray-700">{viewCustomer.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCustomer(null)}>
              Close
            </Button>
            {viewCustomer && (
              <Button
                onClick={() => {
                  openEdit(viewCustomer);
                  setViewCustomer(null);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete Customer"
      />
    </div>
  );
}

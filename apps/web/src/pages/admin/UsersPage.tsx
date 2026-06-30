import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, UserX, Loader2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usersService } from '@/services/users.service';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  branchId?: string;
  branch?: { id: string; name: string };
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'store_keeper', label: 'Store Keeper' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'auditor', label: 'Auditor' },
];

const roleBadgeClass: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  manager: 'bg-blue-100 text-blue-800 border-blue-200',
  cashier: 'bg-green-100 text-green-800 border-green-200',
  store_keeper: 'bg-orange-100 text-orange-800 border-orange-200',
  accountant: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  auditor: 'bg-gray-100 text-gray-800 border-gray-200',
};

function RoleBadge({ role }: { role: string }) {
  const label = ROLES.find((r) => r.value === role)?.label ?? role;
  const cls = roleBadgeClass[role] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <Badge variant="outline" className={`font-medium ${cls}`}>
      {label}
    </Badge>
  );
}

interface UserFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  branchId: string;
  phone: string;
}

const emptyForm = (): UserFormState => ({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'cashier',
  branchId: '',
  phone: '',
});

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm());

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers() as Promise<User[]>,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => usersService.createUser(data),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNewDialogOpen(false);
      setForm(emptyForm());
    },
    onError: () => toast.error('Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      usersService.updateUser(id, data),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
    },
    onError: () => toast.error('Failed to update user'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersService.deactivateUser(id),
    onSuccess: () => {
      toast.success('User deactivated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeactivateUser(null);
    },
    onError: () => toast.error('Failed to deactivate user'),
  });

  function openEdit(user: User) {
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      branchId: user.branchId ?? '',
      phone: user.phone ?? '',
    });
    setEditUser(user);
  }

  function handleCreate() {
    const payload: Record<string, unknown> = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      role: form.role,
      phone: form.phone || undefined,
      branchId: form.branchId || undefined,
    };
    createMutation.mutate(payload);
  }

  function handleUpdate() {
    if (!editUser) return;
    const payload: Record<string, unknown> = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      role: form.role,
      phone: form.phone || undefined,
      branchId: form.branchId || undefined,
    };
    updateMutation.mutate({ id: editUser.id, data: payload });
  }

  const columns: ColumnDef<User>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.original.firstName} {row.original.lastName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: 'branch',
      header: 'Branch',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.branch?.name ?? row.original.branchId ?? '—'}
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
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {row.original.lastLoginAt
            ? new Date(row.original.lastLoginAt).toLocaleDateString('en-UG', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
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
            onClick={() => openEdit(row.original)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {row.original.isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setDeactivateUser(row.original)}
            >
              <UserX className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const UserFormFields = ({ hidePassword }: { hidePassword?: boolean }) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          placeholder="John"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          placeholder="Doe"
        />
      </div>
      <div className="space-y-1.5 col-span-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="john.doe@franjah.com"
        />
      </div>
      {!hidePassword && (
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+256 700 000000"
        />
      </div>
      <div className="space-y-1.5 col-span-2">
        <Label htmlFor="branchId">Branch ID</Label>
        <Input
          id="branchId"
          value={form.branchId}
          onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          placeholder="Branch UUID"
        />
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${users.length} users total`}
        actions={
          <Button
            onClick={() => {
              setForm(emptyForm());
              setNewDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New User
          </Button>
        }
      />

      <DataTable data={users} columns={columns} isLoading={isLoading} />

      {/* New User Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New User</DialogTitle>
          </DialogHeader>
          <UserFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <UserFormFields hidePassword />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        open={!!deactivateUser}
        onOpenChange={(open) => !open && setDeactivateUser(null)}
        title="Deactivate User"
        description={`Are you sure you want to deactivate ${deactivateUser?.firstName} ${deactivateUser?.lastName}? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
        onConfirm={() => deactivateUser && deactivateMutation.mutate(deactivateUser.id)}
        isLoading={deactivateMutation.isPending}
      />
    </div>
  );
}

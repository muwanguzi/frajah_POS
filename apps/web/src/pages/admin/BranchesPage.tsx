import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { branchesService } from '@/services/branches.service';

interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isMain: boolean;
  isActive: boolean;
  createdAt?: string;
}

interface BranchFormState {
  name: string;
  code: string;
  address: string;
  phone: string;
  isMain: boolean;
  isActive: boolean;
}

const emptyForm = (): BranchFormState => ({
  name: '',
  code: '',
  address: '',
  phone: '',
  isMain: false,
  isActive: true,
});

export default function BranchesPage() {
  const queryClient = useQueryClient();

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchFormState>(emptyForm());

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => branchesService.getBranches() as Promise<Branch[]>,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => branchesService.createBranch(data),
    onSuccess: () => {
      toast.success('Branch created successfully');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setNewDialogOpen(false);
      setForm(emptyForm());
    },
    onError: () => toast.error('Failed to create branch'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      branchesService.updateBranch(id, data),
    onSuccess: () => {
      toast.success('Branch updated successfully');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setEditBranch(null);
    },
    onError: () => toast.error('Failed to update branch'),
  });

  function openEdit(branch: Branch) {
    setForm({
      name: branch.name,
      code: branch.code,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      isMain: branch.isMain,
      isActive: branch.isActive,
    });
    setEditBranch(branch);
  }

  function buildPayload(): Record<string, unknown> {
    return {
      name: form.name,
      code: form.code.toUpperCase(),
      address: form.address || undefined,
      phone: form.phone || undefined,
      isMain: form.isMain,
      isActive: form.isActive,
    };
  }

  const columns: ColumnDef<Branch>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Branch Name',
      cell: ({ row }) => (
        <p className="font-medium text-gray-900">{row.original.name}</p>
      ),
    },
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="text-sm font-mono font-semibold text-gray-700 uppercase">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.address ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.phone ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'isMain',
      header: 'Main Branch',
      cell: ({ row }) =>
        row.original.isMain ? (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 font-medium">
            Main
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => openEdit(row.original)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  const BranchFormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="b-name">Branch Name</Label>
        <Input
          id="b-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Kampala Main"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="b-code">Code</Label>
        <Input
          id="b-code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="e.g. KLA"
          maxLength={10}
        />
      </div>
      <div className="space-y-1.5 col-span-2">
        <Label htmlFor="b-address">Address</Label>
        <Input
          id="b-address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Plot 1, Main Street, Kampala"
        />
      </div>
      <div className="space-y-1.5 col-span-2">
        <Label htmlFor="b-phone">Phone</Label>
        <Input
          id="b-phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+256 700 000000"
        />
      </div>
      <div className="flex items-center gap-3 col-span-2">
        <Switch
          id="b-isMain"
          checked={form.isMain}
          onCheckedChange={(v) => setForm({ ...form, isMain: v })}
        />
        <Label htmlFor="b-isMain" className="cursor-pointer">
          Main Branch
        </Label>
      </div>
      <div className="flex items-center gap-3 col-span-2">
        <Switch
          id="b-isActive"
          checked={form.isActive}
          onCheckedChange={(v) => setForm({ ...form, isActive: v })}
        />
        <Label htmlFor="b-isActive" className="cursor-pointer">
          Active
        </Label>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle={`${branches.length} branches total`}
        actions={
          <Button
            onClick={() => {
              setForm(emptyForm());
              setNewDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Branch
          </Button>
        }
      />

      <DataTable data={branches} columns={columns} isLoading={isLoading} />

      {/* New Branch Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Branch</DialogTitle>
          </DialogHeader>
          <BranchFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(buildPayload())}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={!!editBranch} onOpenChange={(open) => !open && setEditBranch(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
          </DialogHeader>
          <BranchFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBranch(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                editBranch && updateMutation.mutate({ id: editBranch.id, data: buildPayload() })
              }
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

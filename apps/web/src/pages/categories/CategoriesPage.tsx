import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SearchInput } from '@/components/shared/SearchInput';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import { categoriesService } from '@/services/categories.service';

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  sortOrder?: number;
  isActive?: boolean;
  productCount?: number;
}

interface CategoryFormState {
  name: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}

const defaultForm: CategoryFormState = {
  name: '',
  parentId: '',
  sortOrder: '0',
  isActive: true,
};

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(defaultForm);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesService.findAll() as Promise<Category[]>,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      editingCategory
        ? categoriesService.update(editingCategory.id, data)
        : categoriesService.create(data),
    onSuccess: () => {
      toast.success(editingCategory ? 'Category updated' : 'Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDialogOpen(false);
      setEditingCategory(null);
      setForm(defaultForm);
    },
    onError: () => {
      toast.error(editingCategory ? 'Failed to update category' : 'Failed to create category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesService.remove(id),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete category');
    },
  });

  const handleSearch = useCallback((val: string) => setSearch(val), []);

  const openAdd = () => {
    setEditingCategory(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      parentId: cat.parentId || '',
      sortOrder: String(cat.sortOrder ?? 0),
      isActive: cat.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    saveMutation.mutate({
      name: form.name.trim(),
      parentId: form.parentId || null,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      isActive: form.isActive,
    });
  };

  const filteredCategories = search
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  // Root-level categories for the parent selector (exclude the category being edited)
  const parentOptions = categories.filter(
    (c) => !editingCategory || c.id !== editingCategory.id
  );

  const columns: ColumnDef<Category>[] = [
    {
      header: '#',
      cell: ({ row }) => (
        <span className="text-gray-400 text-xs">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Category Name',
      cell: ({ row }) => {
        const hasChildren = categories.some((c) => c.parentId === row.original.id);
        return (
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-gray-400 shrink-0" />
            )}
            <div>
              <p className="font-medium text-gray-900">{row.original.name}</p>
              {row.original.description && (
                <p className="text-xs text-gray-400">{row.original.description}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'parent',
      header: 'Parent Category',
      cell: ({ row }) => {
        const parent = row.original.parent
          ? row.original.parent.name
          : row.original.parentId
          ? categories.find((c) => c.id === row.original.parentId)?.name
          : null;
        return (
          <span className="text-sm text-gray-600">
            {parent ? (
              <span className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-gray-400" />
                {parent}
              </span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </span>
        );
      },
    },
    {
      id: 'productCount',
      header: 'Products',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 font-medium">
          {row.original.productCount ?? 0}
        </span>
      ),
    },
    {
      id: 'sortOrder',
      header: 'Sort Order',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{row.original.sortOrder ?? 0}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
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
        placeholder="Search categories..."
        onSearch={handleSearch}
        className="w-64"
      />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories total`}
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        }
      />

      <DataTable
        data={filteredCategories}
        columns={columns}
        isLoading={isLoading}
        toolbar={toolbar}
      />

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingCategory(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name <span className="text-red-500">*</span></Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Beverages"
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <Label htmlFor="cat-parent">Parent Category</Label>
              <Select
                value={form.parentId || 'none'}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, parentId: val === 'none' ? '' : val }))
                }
              >
                <SelectTrigger id="cat-parent">
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top-level)</SelectItem>
                  {parentOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="cat-sort">Sort Order</Label>
              <Input
                id="cat-sort"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                placeholder="0"
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="cat-active" className="cursor-pointer">Active</Label>
              <Switch
                id="cat-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? editingCategory ? 'Updating...' : 'Creating...'
                : editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Category"
        description="Are you sure? Products in this category will be uncategorized. This action cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete Category"
      />
    </div>
  );
}

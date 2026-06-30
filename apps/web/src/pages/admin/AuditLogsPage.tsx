import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, User, Calendar } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiClient from '@/lib/api-client';

interface AuditLog {
  id: string;
  userId?: string;
  user?: { firstName?: string; lastName?: string; email: string };
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-gray-100 text-gray-700',
};

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', entityType],
    queryFn: () =>
      apiClient.get('/audit/logs', {
        params: { entityType: entityType || undefined, limit: 100 },
      }) as Promise<AuditLog[]>,
    retry: false,
  });

  const filtered = logs.filter((log) =>
    !search ||
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.entityType?.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: ColumnDef<AuditLog>[] = [
    {
      header: 'Time',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          {new Date(row.original.createdAt).toLocaleString('en-UG')}
        </div>
      ),
    },
    {
      header: 'User',
      cell: ({ row }) => {
        const u = row.original.user;
        return (
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-3 w-3 text-blue-600" />
            </div>
            <span className="text-sm">
              {u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email : 'System'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = row.original.action;
        const colorClass = ACTION_COLORS[action] || 'bg-gray-100 text-gray-700';
        return (
          <Badge className={`${colorClass} font-mono text-xs border-0`}>{action}</Badge>
        );
      },
    },
    {
      accessorKey: 'entityType',
      header: 'Entity',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 capitalize">
          {row.original.entityType?.toLowerCase().replace('_', ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'entityId',
      header: 'Entity ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-400">
          {row.original.entityId?.slice(0, 8) || '—'}
        </span>
      ),
    },
    {
      header: 'IP Address',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-500">
          {row.original.ipAddress || '—'}
        </span>
      ),
    },
  ];

  const ENTITY_TYPES = [
    'USER', 'PRODUCT', 'SALE', 'PURCHASE_ORDER', 'GOODS_RECEIPT',
    'STOCK_ADJUSTMENT', 'EXPENSE', 'ACCOUNT', 'JOURNAL_ENTRY',
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Track all system activities and changes"
      />

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        toolbar={
          <div className="flex items-center gap-3 w-full">
            <Shield className="h-4 w-4 text-gray-400" />
            <SearchInput
              placeholder="Search by action, entity, or user..."
              onSearch={setSearch}
              className="w-72"
            />
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}

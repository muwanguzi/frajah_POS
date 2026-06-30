import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
  PAID: { label: 'Paid', className: 'bg-green-100 text-green-800 border-green-200' },
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-200' },
  RECEIVED: { label: 'Received', className: 'bg-green-100 text-green-800 border-green-200' },
  DRAFT: { label: 'Draft', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  PARTIAL: { label: 'Partial', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
  VOIDED: { label: 'Voided', className: 'bg-red-100 text-red-800 border-red-200' },
  INACTIVE: { label: 'Inactive', className: 'bg-red-100 text-red-800 border-red-200' },
  IN_TRANSIT: { label: 'In Transit', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  SENT: { label: 'Sent', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  ORDERED: { label: 'Ordered', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-800 border-blue-200' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <Badge
      variant="outline"
      className={cn(config.className, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  );
}

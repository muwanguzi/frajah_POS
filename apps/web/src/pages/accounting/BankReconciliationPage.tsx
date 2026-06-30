import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function BankReconciliationPage() {
  return (
    <div>
      <PageHeader
        title="Bank Reconciliation"
        subtitle="Match cashbook entries with bank statements"
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CreditCard className="h-12 w-12 mb-4 text-gray-200" />
          <h3 className="font-semibold text-gray-600 mb-1">Coming Soon</h3>
          <p className="text-sm text-center max-w-sm">
            Bank reconciliation will allow you to import bank statements and match them with your cashbook entries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// Lazy load all pages
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const TwoFactorPage = React.lazy(() => import('@/pages/auth/TwoFactorPage'));

const AppLayout = React.lazy(() => import('@/components/layout/AppLayout'));
const PrivateRoute = React.lazy(() => import('@/router/PrivateRoute'));

const DashboardPage = React.lazy(() => import('@/pages/dashboard/DashboardPage'));

const ProductsPage = React.lazy(() => import('@/pages/products/ProductsPage'));
const ProductFormPage = React.lazy(() => import('@/pages/products/ProductFormPage'));
const ProductDetailPage = React.lazy(() => import('@/pages/products/ProductDetailPage'));

const CategoriesPage = React.lazy(() => import('@/pages/categories/CategoriesPage'));

const SuppliersPage = React.lazy(() => import('@/pages/suppliers/SuppliersPage'));
const SupplierDetailPage = React.lazy(() => import('@/pages/suppliers/SupplierDetailPage'));

const PurchasingPage = React.lazy(() => import('@/pages/purchasing/PurchasingPage'));
const PurchaseOrdersPage = React.lazy(() => import('@/pages/purchasing/PurchaseOrdersPage'));
const PurchaseOrderFormPage = React.lazy(() => import('@/pages/purchasing/PurchaseOrderFormPage'));
const PurchaseOrderDetailPage = React.lazy(() => import('@/pages/purchasing/PurchaseOrderDetailPage'));
const GoodsReceiptPage = React.lazy(() => import('@/pages/purchasing/GoodsReceiptPage'));
const BatchesPage = React.lazy(() => import('@/pages/purchasing/BatchesPage'));

const InventoryPage = React.lazy(() => import('@/pages/inventory/InventoryPage'));
const AdjustmentsPage = React.lazy(() => import('@/pages/inventory/AdjustmentsPage'));
const TransfersPage = React.lazy(() => import('@/pages/inventory/TransfersPage'));
const StockCountPage = React.lazy(() => import('@/pages/inventory/StockCountPage'));

const CustomersPage = React.lazy(() => import('@/pages/customers/CustomersPage'));
const CustomerDetailPage = React.lazy(() => import('@/pages/customers/CustomerDetailPage'));

const SalesPage = React.lazy(() => import('@/pages/sales/SalesPage'));
const OrdersPage = React.lazy(() => import('@/pages/sales/OrdersPage'));
const InvoicesPage = React.lazy(() => import('@/pages/sales/InvoicesPage'));
const QuotesPage = React.lazy(() => import('@/pages/sales/QuotesPage'));
const DeliveryNotesPage = React.lazy(() => import('@/pages/sales/DeliveryNotesPage'));
const CreditNotesPage = React.lazy(() => import('@/pages/sales/CreditNotesPage'));

const AccountingPage = React.lazy(() => import('@/pages/accounting/AccountingPage'));
const GeneralLedgerPage = React.lazy(() => import('@/pages/accounting/GeneralLedgerPage'));
const CashbookPage = React.lazy(() => import('@/pages/accounting/CashbookPage'));
const BankReconciliationPage = React.lazy(() => import('@/pages/accounting/BankReconciliationPage'));
const VATReportPage = React.lazy(() => import('@/pages/accounting/VATReportPage'));

const ExpensesPage = React.lazy(() => import('@/pages/expenses/ExpensesPage'));
const ExpenseApprovalPage = React.lazy(() => import('@/pages/expenses/ExpenseApprovalPage'));

const ReportsPage = React.lazy(() => import('@/pages/reports/ReportsPage'));
const SalesReportPage = React.lazy(() => import('@/pages/reports/SalesReportPage'));
const InventoryReportPage = React.lazy(() => import('@/pages/reports/InventoryReportPage'));
const ProfitLossPage = React.lazy(() => import('@/pages/reports/ProfitLossPage'));
const ExpensesReportPage = React.lazy(() => import('@/pages/reports/ExpensesReportPage'));

const UsersPage = React.lazy(() => import('@/pages/admin/UsersPage'));
const BranchesPage = React.lazy(() => import('@/pages/admin/BranchesPage'));
const AuditLogsPage = React.lazy(() => import('@/pages/admin/AuditLogsPage'));
const SettingsPage = React.lazy(() => import('@/pages/admin/SettingsPage'));

const POSPage = React.lazy(() => import('@/pages/pos/POSPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}

const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/2fa',
    element: (
      <Suspense fallback={<PageLoader />}>
        <TwoFactorPage />
      </Suspense>
    ),
  },

  // POS route (auth required, no AppLayout)
  {
    element: (
      <Suspense fallback={<PageLoader />}>
        <PrivateRoute />
      </Suspense>
    ),
    children: [
      {
        path: '/pos',
        element: (
          <Suspense fallback={<PageLoader />}>
            <POSPage />
          </Suspense>
        ),
      },
    ],
  },

  // Protected routes with AppLayout
  {
    element: (
      <Suspense fallback={<PageLoader />}>
        <PrivateRoute />
      </Suspense>
    ),
    children: [
      {
        element: (
          <Suspense fallback={<PageLoader />}>
            <AppLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            ),
          },

          // Products
          {
            path: 'products',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProductsPage />
              </Suspense>
            ),
          },
          {
            path: 'products/new',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProductFormPage />
              </Suspense>
            ),
          },
          {
            path: 'products/:id',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProductDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'products/:id/edit',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProductFormPage />
              </Suspense>
            ),
          },

          // Categories
          {
            path: 'categories',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CategoriesPage />
              </Suspense>
            ),
          },

          // Suppliers
          {
            path: 'suppliers',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SuppliersPage />
              </Suspense>
            ),
          },
          {
            path: 'suppliers/:id',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SupplierDetailPage />
              </Suspense>
            ),
          },

          // Purchasing
          {
            path: 'purchasing',
            element: (
              <Suspense fallback={<PageLoader />}>
                <PurchasingPage />
              </Suspense>
            ),
          },
          {
            path: 'purchasing/orders',
            element: (
              <Suspense fallback={<PageLoader />}>
                <PurchaseOrdersPage />
              </Suspense>
            ),
          },
          {
            path: 'purchasing/orders/new',
            element: (
              <Suspense fallback={<PageLoader />}>
                <PurchaseOrderFormPage />
              </Suspense>
            ),
          },
          {
            path: 'purchasing/orders/:id',
            element: (
              <Suspense fallback={<PageLoader />}>
                <PurchaseOrderDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'purchasing/receipts',
            element: (
              <Suspense fallback={<PageLoader />}>
                <GoodsReceiptPage />
              </Suspense>
            ),
          },
          {
            path: 'purchasing/batches',
            element: (
              <Suspense fallback={<PageLoader />}>
                <BatchesPage />
              </Suspense>
            ),
          },

          // Inventory
          {
            path: 'inventory',
            element: (
              <Suspense fallback={<PageLoader />}>
                <InventoryPage />
              </Suspense>
            ),
          },
          {
            path: 'inventory/adjustments',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdjustmentsPage />
              </Suspense>
            ),
          },
          {
            path: 'inventory/transfers',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TransfersPage />
              </Suspense>
            ),
          },
          {
            path: 'inventory/stock-count',
            element: (
              <Suspense fallback={<PageLoader />}>
                <StockCountPage />
              </Suspense>
            ),
          },

          // Customers
          {
            path: 'customers',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CustomersPage />
              </Suspense>
            ),
          },
          {
            path: 'customers/:id',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CustomerDetailPage />
              </Suspense>
            ),
          },

          // Sales
          {
            path: 'sales',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SalesPage />
              </Suspense>
            ),
          },
          {
            path: 'sales/orders',
            element: (
              <Suspense fallback={<PageLoader />}>
                <OrdersPage />
              </Suspense>
            ),
          },
          {
            path: 'sales/invoices',
            element: (
              <Suspense fallback={<PageLoader />}>
                <InvoicesPage />
              </Suspense>
            ),
          },
          {
            path: 'sales/quotes',
            element: (
              <Suspense fallback={<PageLoader />}>
                <QuotesPage />
              </Suspense>
            ),
          },
          {
            path: 'sales/delivery-notes',
            element: (
              <Suspense fallback={<PageLoader />}>
                <DeliveryNotesPage />
              </Suspense>
            ),
          },
          {
            path: 'sales/credit-notes',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CreditNotesPage />
              </Suspense>
            ),
          },

          // Accounting
          {
            path: 'accounting',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AccountingPage />
              </Suspense>
            ),
          },
          {
            path: 'accounting/ledger',
            element: (
              <Suspense fallback={<PageLoader />}>
                <GeneralLedgerPage />
              </Suspense>
            ),
          },
          {
            path: 'accounting/cashbook',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CashbookPage />
              </Suspense>
            ),
          },
          {
            path: 'accounting/reconciliation',
            element: (
              <Suspense fallback={<PageLoader />}>
                <BankReconciliationPage />
              </Suspense>
            ),
          },
          {
            path: 'accounting/vat',
            element: (
              <Suspense fallback={<PageLoader />}>
                <VATReportPage />
              </Suspense>
            ),
          },

          // Expenses
          {
            path: 'expenses',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ExpensesPage />
              </Suspense>
            ),
          },
          {
            path: 'expenses/approvals',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ExpenseApprovalPage />
              </Suspense>
            ),
          },

          // Reports
          {
            path: 'reports',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            ),
          },
          {
            path: 'reports/sales',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SalesReportPage />
              </Suspense>
            ),
          },
          {
            path: 'reports/inventory',
            element: (
              <Suspense fallback={<PageLoader />}>
                <InventoryReportPage />
              </Suspense>
            ),
          },
          {
            path: 'reports/profit-loss',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProfitLossPage />
              </Suspense>
            ),
          },
          {
            path: 'reports/expenses',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ExpensesReportPage />
              </Suspense>
            ),
          },

          // Admin
          {
            path: 'users',
            element: (
              <Suspense fallback={<PageLoader />}>
                <UsersPage />
              </Suspense>
            ),
          },
          {
            path: 'branches',
            element: (
              <Suspense fallback={<PageLoader />}>
                <BranchesPage />
              </Suspense>
            ),
          },
          {
            path: 'audit',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AuditLogsPage />
              </Suspense>
            ),
          },
          {
            path: 'settings',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

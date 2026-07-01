import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, User, KeyRound, LogOut, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useBranchStore } from '@/stores/branch.store';
import { authService } from '@/services/auth.service';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/categories': 'Categories',
  '/suppliers': 'Suppliers',
  '/customers': 'Customers',
  '/purchasing': 'Purchasing',
  '/purchasing/orders': 'Purchase Orders',
  '/purchasing/receipts': 'Goods Receipts',
  '/purchasing/batches': 'Batch Tracking',
  '/inventory': 'Inventory',
  '/inventory/adjustments': 'Stock Adjustments',
  '/inventory/transfers': 'Stock Transfers',
  '/inventory/stock-count': 'Stock Count',
  '/sales': 'Sales Overview',
  '/sales/orders': 'Sales Orders',
  '/sales/invoices': 'Invoices',
  '/sales/quotes': 'Quotations',
  '/sales/delivery-notes': 'Delivery Notes',
  '/sales/credit-notes': 'Credit Notes',
  '/accounting': 'Accounting',
  '/accounting/ledger': 'General Ledger',
  '/accounting/cashbook': 'Cashbook',
  '/accounting/reconciliation': 'Bank Reconciliation',
  '/accounting/vat': 'VAT Report',
  '/expenses': 'Expenses',
  '/expenses/approvals': 'Expense Approvals',
  '/reports': 'Reports',
  '/reports/sales': 'Sales Report',
  '/reports/inventory': 'Inventory Report',
  '/reports/profit-loss': 'Profit & Loss',
  '/users': 'User Management',
  '/branches': 'Branches',
  '/audit': 'Audit Logs',
  '/settings': 'Settings',
};

export default function Topbar() {
  const { toggleMobileMenu } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const { activeBranchName } = useBranchStore();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = routeTitles[location.pathname] || 'Frajah Clas-tic Stores';

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <header className="h-16 bg-white border-b flex items-center px-3 sm:px-6 gap-2 sm:gap-4 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="h-8 w-8 lg:hidden shrink-0"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">{pageTitle}</h2>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {/* Branch Indicator */}
        {activeBranchName && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 text-sm">
            <Building2 className="h-3.5 w-3.5" />
            <span className="font-medium">{activeBranchName}</span>
          </div>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

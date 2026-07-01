import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Tag,
  Boxes,
  ShoppingBag,
  Layers,
  Users,
  Truck,
  Calculator,
  CreditCard,
  BarChart3,
  UserCog,
  Building2,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

interface NavGroup {
  section: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const navGroups: NavGroup[] = [
  {
    section: 'MAIN',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'POS Terminal', href: '/pos', icon: ShoppingCart },
      { label: 'Sales Overview', href: '/sales', icon: Receipt },
    ],
  },
  {
    section: 'INVENTORY',
    items: [
      { label: 'Products', href: '/products', icon: Package },
      { label: 'Categories', href: '/categories', icon: Tag },
      { label: 'Stock & Inventory', href: '/inventory', icon: Boxes },
      { label: 'Purchasing', href: '/purchasing', icon: ShoppingBag },
      { label: 'Batch Tracking', href: '/purchasing/batches', icon: Layers },
    ],
  },
  {
    section: 'PEOPLE',
    items: [
      { label: 'Customers', href: '/customers', icon: Users },
      { label: 'Suppliers', href: '/suppliers', icon: Truck },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { label: 'Accounting', href: '/accounting', icon: Calculator },
      { label: 'Expenses', href: '/expenses', icon: CreditCard },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    section: 'ADMIN',
    adminOnly: true,
    items: [
      { label: 'Users', href: '/users', icon: UserCog },
      { label: 'Branches', href: '/branches', icon: Building2 },
      { label: 'Audit Logs', href: '/audit', icon: Shield },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, closeMobileMenu } = useUIStore();
  const { user } = useAuthStore();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  // The icon-only collapse only applies on desktop — the mobile drawer always
  // shows full labels, even if a desktop session previously collapsed it.
  const collapsed = isDesktop && sidebarCollapsed;

  const handlePOSClick = (e: React.MouseEvent, href: string) => {
    closeMobileMenu();
    if (href === '/pos') {
      e.preventDefault();
      navigate('/pos');
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'flex flex-col h-screen bg-slate-900 text-slate-100 transition-transform duration-300 shrink-0 w-64',
          'fixed inset-y-0 left-0 z-50 lg:static lg:transition-[width]',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-3 border-b border-slate-700">
          {collapsed ? (
            <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Frajah" className="w-8 h-8 object-cover object-left" />
            </div>
          ) : (
            <img
              src="/logo.png"
              alt="Frajah Clas-tic Stores"
              className="h-10 w-auto object-contain bg-white rounded-lg px-2 py-1"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {navGroups.map((group) => {
            if (group.adminOnly && !isAdmin) return null;
            return (
              <div key={group.section} className="mb-4">
                {!collapsed && (
                  <p className="px-4 mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {group.section}
                  </p>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const navItem = (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={(e) => handlePOSClick(e, item.href)}
                      end={item.href === '/dashboard'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
                          collapsed ? 'justify-center' : '',
                          isActive
                            ? 'bg-slate-700 text-white font-medium'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </NavLink>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return navItem;
                })}
              </div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-700 p-3">
          {!collapsed && user ? (
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full shrink-0 text-white text-sm font-bold">
                {user.firstName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-100 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate capitalize">
                  {user.role?.toLowerCase()}
                </p>
              </div>
            </div>
          ) : collapsed && user ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full mx-auto text-white text-sm font-bold cursor-pointer">
                  {user.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {user.firstName} {user.lastName}
              </TooltipContent>
            </Tooltip>
          ) : null}

          {/* Collapse toggle — desktop only, meaningless inside the mobile drawer */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-full mt-2 h-8 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

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
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();

  const handlePOSClick = (e: React.MouseEvent, href: string) => {
    if (href === '/pos') {
      e.preventDefault();
      navigate('/pos');
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-screen bg-slate-900 text-slate-100 transition-all duration-300 shrink-0',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-slate-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg shrink-0">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg truncate">Franjah POS</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {navGroups.map((group) => {
            if (group.adminOnly && !isAdmin) return null;
            return (
              <div key={group.section} className="mb-4">
                {!sidebarCollapsed && (
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
                          sidebarCollapsed ? 'justify-center' : '',
                          isActive
                            ? 'bg-slate-700 text-white font-medium'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </NavLink>
                  );

                  if (sidebarCollapsed) {
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
          {!sidebarCollapsed && user ? (
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
          ) : sidebarCollapsed && user ? (
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

          {/* Collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full mt-2 h-8 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
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

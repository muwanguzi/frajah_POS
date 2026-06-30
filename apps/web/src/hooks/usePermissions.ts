import { useAuthStore } from '@/stores/auth.store';

export function usePermissions() {
  const { user } = useAuthStore();

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some((role) => user?.role === role);
  };

  const isAdmin = hasAnyRole(['admin']);
  const isManager = hasAnyRole(['admin', 'manager']);

  return { hasRole, hasAnyRole, isAdmin, isManager, userRole: user?.role };
}

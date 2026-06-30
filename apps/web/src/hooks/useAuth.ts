import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';

export function useAuth() {
  const navigate = useNavigate();
  const { user, isAuthenticated, accessToken, setAuth, clearAuth, updateUser } =
    useAuthStore();

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore errors on logout
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  return { user, isAuthenticated, accessToken, setAuth, clearAuth, updateUser, logout };
}

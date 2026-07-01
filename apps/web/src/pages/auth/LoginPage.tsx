import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Loader2,
  TrendingUp,
  Boxes,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    branchId?: string;
    twoFactorEnabled?: boolean;
  };
  accessToken: string;
  requiresTwoFactor?: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    try {
      const response = (await authService.login(data)) as LoginResponse;
      if (response.requiresTwoFactor) {
        navigate('/2fa', { state: { userId: response.user.id } });
        return;
      }
      setAuth(response.user, response.accessToken);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 to-blue-700 flex-col justify-between p-12">
        <div>
          {/* Logo */}
          <div className="mb-16">
            <img
              src="/logo.png"
              alt="Frajah Clas-tic Stores"
              className="h-20 w-auto object-contain bg-white rounded-2xl px-4 py-2"
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Your Kitchenware &amp;
            <br />
            <span className="text-blue-200">Household Store POS</span>
          </h1>
          <p className="text-blue-200 text-lg mb-12">
            Complete point-of-sale and business management platform for
            Frajah Clas-tic Stores — kitchenware, cookware, and household essentials.
          </p>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg shrink-0">
                <TrendingUp className="h-5 w-5 text-blue-200" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Real-time Profit Tracking</h3>
                <p className="text-blue-200 text-sm mt-0.5">
                  Monitor gross profit, net profit, and margins live as sales happen
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg shrink-0">
                <Boxes className="h-5 w-5 text-blue-200" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Multi-branch Inventory</h3>
                <p className="text-blue-200 text-sm mt-0.5">
                  Manage stock across all your branches with automatic sync
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg shrink-0">
                <Calculator className="h-5 w-5 text-blue-200" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Full Accounting Suite</h3>
                <p className="text-blue-200 text-sm mt-0.5">
                  Double-entry bookkeeping, VAT returns, and financial statements
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-blue-300 text-sm">
          © 2026 Frajah Clas-tic Stores. All rights reserved.
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <img
              src="/logo.png"
              alt="Frajah Clas-tic Stores"
              className="h-14 w-auto object-contain"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-1">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-400' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={errors.password ? 'border-red-400 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

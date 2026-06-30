import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

interface TwoFAResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    branchId?: string;
  };
  accessToken: string;
}

export default function TwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const userId = (location.state as { userId?: string })?.userId;

  useEffect(() => {
    if (!userId) {
      navigate('/login', { replace: true });
    }
    inputRef.current?.focus();
  }, [userId, navigate]);

  const handleCodeChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
    setError('');

    if (cleaned.length === 6) {
      setIsLoading(true);
      try {
        const response = (await authService.verify2FA({
          userId: userId!,
          code: cleaned,
        })) as TwoFAResponse;
        setAuth(response.user, response.accessToken);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Invalid code. Please try again.'
        );
        setCode('');
        inputRef.current?.focus();
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 bg-blue-50 rounded-xl mx-auto mb-6">
            <Shield className="h-7 w-7 text-blue-600" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Enter the 6-digit code from your authenticator app to continue
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="000000"
                disabled={isLoading}
                className="text-center text-3xl tracking-[0.5em] h-16 font-mono"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              )}
            </div>

            <p className="text-xs text-center text-gray-400">
              Code auto-submits when 6 digits are entered
            </p>

            <Button
              onClick={() => handleCodeChange(code)}
              disabled={code.length !== 6 || isLoading}
              className="w-full h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

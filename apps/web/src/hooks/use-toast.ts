import toast from 'react-hot-toast';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  return {
    toast: ({ title, description, variant, duration = 4000 }: ToastOptions) => {
      const message = description ? `${title}: ${description}` : title;
      if (variant === 'destructive') {
        toast.error(message, { duration });
      } else {
        toast.success(message, { duration });
      }
    },
  };
}

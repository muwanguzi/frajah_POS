import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'An error occurred';
        toast.error(message);
      },
    },
  },
});

import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Configuration
 * Provides caching and data synchronization for API calls
 */

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - Data considered fresh for 5 min
            cacheTime: 10 * 60 * 1000, // 10 minutes - Cache kept for 10 min
            refetchOnWindowFocus: false, // Don't refetch on window focus
            refetchOnReconnect: true, // Refetch on network reconnect
            retry: 1, // Retry failed requests once
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        },
        mutations: {
            retry: false, // Don't retry mutations
        },
    },
});

export default queryClient;

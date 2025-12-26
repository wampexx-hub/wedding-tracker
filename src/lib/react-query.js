import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 0, // Always fetch fresh data (real-time sync)
            gcTime: 1000 * 60 * 30, // 30 minutes (renamed from cacheTime in v5)
            refetchOnWindowFocus: true,
        },
    },
});

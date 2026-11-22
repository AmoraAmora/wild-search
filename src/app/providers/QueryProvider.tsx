import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useState, type ReactNode } from 'react';

import { shouldRetryRequest } from '@/shared/api';

import { reportError } from '../lib/report-error';

// Devtools are loaded only in development so they never reach the production bundle.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : null;

function createQueryClient() {
  return new QueryClient({
    // Global hooks fire once per failed query/mutation (after retries), unlike per-component handlers.
    queryCache: new QueryCache({
      onError: (error, query) => reportError(error, `query ${JSON.stringify(query.queryKey)}`),
    }),
    mutationCache: new MutationCache({
      onError: (error) => reportError(error, 'download'),
    }),
    defaultOptions: {
      queries: {
        // The default (3 retries for any error) would also retry 404s and schema errors.
        retry: shouldRetryRequest,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
      },
    },
  });
}

type QueryProviderProps = {
  children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
  // Lazy initializer keeps a single client per app instance (safe with StrictMode / HMR).
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}

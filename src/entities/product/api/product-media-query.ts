import { queryOptions } from '@tanstack/react-query';

import { cdnRoutesQueryOptions, shouldRetryRequest } from '@/shared/api';

import { fetchProductMedia } from './product-card';

export const productQueryKeys = {
  all: ['product'] as const,
  media: (nmId: number) => [...productQueryKeys.all, nmId, 'media'] as const,
};

export const productMediaQueryOptions = (nmId: number) =>
  queryOptions({
    queryKey: productQueryKeys.media(nmId),
    queryFn: async ({ client, signal }) => {
      // Served from cache after the first product; fetched once per session otherwise.
      const routes = await client.ensureQueryData(cdnRoutesQueryOptions());
      return fetchProductMedia(nmId, routes, { signal });
    },
    // Explicit, so the policy holds with any QueryClient: network hiccups and 5xx are
    // retried, while ProductNotFoundError or a changed response format are not.
    retry: shouldRetryRequest,
  });

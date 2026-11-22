import { queryOptions } from '@tanstack/react-query';

import { cdnRoutesQueryOptions } from '@/shared/api';

import { ProductNotFoundError } from '../model/errors';
import { fetchProductMedia } from './product-card';

const MAX_RETRIES = 2;

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
    // A missing product will not appear on retry; network hiccups might.
    retry: (failureCount, error) =>
      !(error instanceof ProductNotFoundError) && failureCount < MAX_RETRIES,
  });

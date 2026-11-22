import { queryOptions } from '@tanstack/react-query';
// zod/mini: same validation engine, tree-shakable functional API (~10x smaller bundle).
import * as z from 'zod/mini';

import { fetchJson, type RequestOptions } from '../http';
import type { CdnRoutes, HostRange } from './model';

const UPSTREAMS_URL = 'https://cdn.wbbasket.ru/api/v3/upstreams';

const volume = z.int().check(z.nonnegative());

const hostRangeSchema = z.pipe(
  z.object({
    vol_range_from: volume,
    vol_range_to: volume,
    host: z.string().check(z.minLength(1)),
  }),
  z.transform(({ vol_range_from, vol_range_to, host }): HostRange => ({
    from: vol_range_from,
    to: vol_range_to,
    host,
  })),
);

/**
 * `origin.*` route maps use the `range` method: the host is picked by the volume number.
 * The literal is strict on purpose — if WB switches the method, failing loudly is
 * better than silently building broken URLs.
 */
const rangeRouteMapSchema = z.pipe(
  z
    .array(z.object({ method: z.literal('range'), hosts: z.array(hostRangeSchema) }))
    .check(z.minLength(1)),
  z.transform((entries) => entries.flatMap((entry) => entry.hosts)),
);

/** Only the fields the app needs; the rest of the response is ignored. */
export const upstreamsResponseSchema = z.pipe(
  z.object({
    origin: z.object({
      mediabasket_route_map: rangeRouteMapSchema,
      videonme_route_map: rangeRouteMapSchema,
    }),
  }),
  z.transform(({ origin }): CdnRoutes => ({
    media: origin.mediabasket_route_map,
    video: origin.videonme_route_map,
  })),
);

export async function fetchCdnRoutes(options?: RequestOptions): Promise<CdnRoutes> {
  const response = await fetchJson(UPSTREAMS_URL, options);
  return upstreamsResponseSchema.parse(response);
}

export const cdnRoutesQueryOptions = () =>
  queryOptions({
    queryKey: ['wb-cdn', 'routes'] as const,
    queryFn: ({ signal }) => fetchCdnRoutes({ signal }),
    // The host map changes only when WB adds new baskets: fetch it once per session.
    staleTime: Infinity,
    gcTime: Infinity,
  });

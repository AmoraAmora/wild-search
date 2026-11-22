import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { fetchJson, type RequestOptions } from '../http';
import type { CdnRoutes, HostRange } from './model';

const UPSTREAMS_URL = 'https://cdn.wbbasket.ru/api/v3/upstreams';

const hostRangeSchema = z
  .object({
    vol_range_from: z.number().int().nonnegative(),
    vol_range_to: z.number().int().nonnegative(),
    host: z.string().min(1),
  })
  .transform(({ vol_range_from, vol_range_to, host }): HostRange => ({
    from: vol_range_from,
    to: vol_range_to,
    host,
  }));

/**
 * `origin.*` route maps use the `range` method: the host is picked by the volume number.
 * The literal is strict on purpose — if WB switches the method, failing loudly is
 * better than silently building broken URLs.
 */
const rangeRouteMapSchema = z
  .array(z.object({ method: z.literal('range'), hosts: z.array(hostRangeSchema) }))
  .nonempty()
  .transform((entries) => entries.flatMap((entry) => entry.hosts));

/** Only the fields the app needs; the rest of the response is ignored. */
export const upstreamsResponseSchema = z
  .object({
    origin: z.object({
      mediabasket_route_map: rangeRouteMapSchema,
      videonme_route_map: rangeRouteMapSchema,
    }),
  })
  .transform(({ origin }): CdnRoutes => ({
    media: origin.mediabasket_route_map,
    video: origin.videonme_route_map,
  }));

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

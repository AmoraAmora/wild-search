import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProductNotFoundError } from '../model/errors';
import { productMediaQueryOptions } from './product-media-query';

const UPSTREAMS = {
  origin: {
    mediabasket_route_map: [
      {
        method: 'range',
        hosts: [{ vol_range_from: 5814, vol_range_to: 6125, host: 'basket-30.wbbasket.ru' }],
      },
    ],
    videonme_route_map: [
      {
        method: 'range',
        hosts: [{ vol_range_from: 0, vol_range_to: 143, host: 'videonme-basket-01.wbbasket.ru' }],
      },
    ],
  },
};

const CARDS: Record<string, unknown> = {
  '604174866': { imt_name: 'Джинсы', media: { photo_count: 20, has_video: true } },
  '592995535': { imt_name: 'Кроссовки', media: { photo_count: 21, has_video: true } },
};

function stubWbCdn() {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = String(input);

    if (url.endsWith('/api/v3/upstreams')) {
      return Response.json(UPSTREAMS);
    }

    const nmId = /\/(\d+)\/info\/ru\/card\.json$/.exec(url)?.[1];
    const card = nmId === undefined ? undefined : CARDS[nmId];

    return card ? Response.json(card) : new Response('Not found', { status: 404 });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const countCalls = (fetchMock: ReturnType<typeof stubWbCdn>, suffix: string) =>
  fetchMock.mock.calls.filter(([input]) => String(input).endsWith(suffix)).length;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('productMediaQueryOptions', () => {
  it('fetches the CDN host map once and reuses it for every product', async () => {
    const fetchMock = stubWbCdn();
    const client = new QueryClient();

    const jeans = await client.fetchQuery(productMediaQueryOptions(604174866));
    const sneakers = await client.fetchQuery(productMediaQueryOptions(592995535));

    expect(jeans.photos).toHaveLength(20);
    expect(sneakers.photos).toHaveLength(21);
    expect(countCalls(fetchMock, '/api/v3/upstreams')).toBe(1);
  });

  it('does not retry when the product does not exist', async () => {
    const fetchMock = stubWbCdn();
    const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });

    await expect(client.fetchQuery(productMediaQueryOptions(600000001))).rejects.toBeInstanceOf(
      ProductNotFoundError,
    );
    expect(countCalls(fetchMock, '/card.json')).toBe(1);
  });

  it('retries transient failures', async () => {
    const fetchMock = stubWbCdn();
    fetchMock.mockResolvedValueOnce(Response.json(UPSTREAMS));
    fetchMock.mockResolvedValueOnce(new Response('Bad gateway', { status: 502 }));
    const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });

    const media = await client.fetchQuery(productMediaQueryOptions(604174866));

    expect(media.photos).toHaveLength(20);
    expect(countCalls(fetchMock, '/card.json')).toBe(2);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import type { CdnRoutes } from '@/shared/api';

import { ProductNotFoundError } from '../model/errors';
import { fetchProductMedia, productCardSchema, toProductMedia } from './product-card';

const NM_ID = 604174866;
const MEDIA_BASE = 'https://basket-30.wbbasket.ru/vol6041/part604174/604174866';
const VIDEO_BASE = 'https://videonme-basket-10.wbbasket.ru/vol114/part60417/604174866';

const ROUTES: CdnRoutes = {
  media: [{ from: 5814, to: 6125, host: 'basket-30.wbbasket.ru' }],
  video: [{ from: 108, to: 119, host: 'videonme-basket-10.wbbasket.ru' }],
};

// Trimmed real card.json of the example product.
const CARD_JSON = {
  nm_id: NM_ID,
  imt_name: 'Джинсы бананы широкие',
  subj_name: 'Джинсы',
  media: { has_video: true, photo_count: 3, best_qualities_photos: [1, 3] },
};

function mockFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('productCardSchema', () => {
  it('defaults missing media fields to "no photos, no video"', () => {
    expect(productCardSchema.parse({}).media).toEqual({
      photo_count: 0,
      has_video: false,
      best_qualities_photos: [],
    });
    expect(productCardSchema.parse({ media: { photo_count: 2 } }).media).toEqual({
      photo_count: 2,
      has_video: false,
      best_qualities_photos: [],
    });
  });

  it('rejects malformed media fields', () => {
    expect(() => productCardSchema.parse({ media: { photo_count: '3' } })).toThrow(ZodError);
    expect(() => productCardSchema.parse({ media: { photo_count: -1 } })).toThrow(ZodError);
  });
});

describe('toProductMedia', () => {
  const card = productCardSchema.parse(CARD_JSON);

  it('lists photos 1..photo_count with grid previews', () => {
    const media = toProductMedia(NM_ID, card, { mediaBaseUrl: MEDIA_BASE, videoBaseUrl: null });

    expect(media.photos.map((photo) => photo.index)).toEqual([1, 2, 3]);
    expect(media.photos[0]?.previewUrl).toBe(`${MEDIA_BASE}/images/c246x328/1.webp`);
  });

  it('downloads hq only for photos listed in best_qualities_photos, big otherwise', () => {
    const media = toProductMedia(NM_ID, card, { mediaBaseUrl: MEDIA_BASE, videoBaseUrl: null });

    expect(media.photos.map((photo) => photo.downloadUrl)).toEqual([
      `${MEDIA_BASE}/images/hq/1.webp`,
      `${MEDIA_BASE}/images/big/2.webp`,
      `${MEDIA_BASE}/images/hq/3.webp`,
    ]);
  });

  it('falls back to a generic name when the card has none', () => {
    const media = toProductMedia(NM_ID, productCardSchema.parse({}), {
      mediaBaseUrl: MEDIA_BASE,
      videoBaseUrl: null,
    });

    expect(media.name).toBe(`Товар ${NM_ID}`);
    expect(media.photos).toEqual([]);
  });
});

describe('fetchProductMedia', () => {
  it('loads card.json from the resolved basket and maps it', async () => {
    const fetchMock = mockFetch(Response.json(CARD_JSON));

    const media = await fetchProductMedia(NM_ID, ROUTES);

    expect(fetchMock).toHaveBeenCalledWith(`${MEDIA_BASE}/info/ru/card.json`, undefined);
    expect(media).toMatchObject({
      nmId: NM_ID,
      name: 'Джинсы бананы широкие',
      videoBaseUrl: VIDEO_BASE,
    });
    expect(media.photos).toHaveLength(3);
  });

  it('sets videoBaseUrl to null when the product has no video', async () => {
    mockFetch(Response.json({ ...CARD_JSON, media: { ...CARD_JSON.media, has_video: false } }));

    await expect(fetchProductMedia(NM_ID, ROUTES)).resolves.toMatchObject({ videoBaseUrl: null });
  });

  it('throws ProductNotFoundError when the CDN has no card (404)', async () => {
    mockFetch(new Response('Not found', { status: 404 }));

    await expect(fetchProductMedia(NM_ID, ROUTES)).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('throws ProductNotFoundError when no basket serves the article', async () => {
    const fetchMock = mockFetch(Response.json(CARD_JSON));

    await expect(fetchProductMedia(999_999_999_999, ROUTES)).rejects.toBeInstanceOf(
      ProductNotFoundError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates other errors as is', async () => {
    mockFetch(new Response('Server error', { status: 500 }));

    await expect(fetchProductMedia(NM_ID, ROUTES)).rejects.toMatchObject({
      name: 'HttpError',
      status: 500,
    });
  });
});

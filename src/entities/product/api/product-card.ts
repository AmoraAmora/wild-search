import * as z from 'zod/mini';

import {
  CdnHostNotFoundError,
  fetchJson,
  ImageSize,
  isHttpError,
  productCardInfoUrl,
  productImageUrl,
  productMediaBaseUrl,
  productVideoBaseUrl,
  type CdnRoutes,
  type RequestOptions,
} from '@/shared/api';

import { ProductNotFoundError } from '../model/errors';
import type { ProductMedia, ProductPhoto } from '../model/types';

const EMPTY_MEDIA = { photo_count: 0, has_video: false, best_qualities_photos: [] };

/** `card.json` from the basket CDN — only the fields the app uses. */
export const productCardSchema = z.object({
  imt_name: z.optional(z.string()),
  media: z._default(
    z.object({
      photo_count: z._default(z.int().check(z.nonnegative()), 0),
      has_video: z._default(z.boolean(), false),
      /** Photos that also exist in `hq` size; absent when none do. */
      best_qualities_photos: z._default(z.array(z.int().check(z.positive())), []),
    }),
    EMPTY_MEDIA,
  ),
});

type ProductCardDto = z.infer<typeof productCardSchema>;

type MediaBaseUrls = {
  mediaBaseUrl: string;
  /** `null` when the product has no video. */
  videoBaseUrl: string | null;
};

export function toProductMedia(
  nmId: number,
  card: ProductCardDto,
  { mediaBaseUrl, videoBaseUrl }: MediaBaseUrls,
): ProductMedia {
  const hqPhotos = new Set(card.media.best_qualities_photos);

  const photos = Array.from({ length: card.media.photo_count }, (_, offset): ProductPhoto => {
    const index = offset + 1;
    const downloadSize = hqPhotos.has(index) ? ImageSize.Hq : ImageSize.Big;

    return {
      index,
      previewUrl: productImageUrl(mediaBaseUrl, index, ImageSize.Medium),
      downloadUrl: productImageUrl(mediaBaseUrl, index, downloadSize),
    };
  });

  return {
    nmId,
    name: card.imt_name ?? `Товар ${nmId}`,
    photos,
    videoBaseUrl,
  };
}

/**
 * Loads the product card from the basket CDN. Used instead of
 * `wildberries.ru/__internal/card/cards/v4/detail`, which sits behind WB's anti-bot
 * protection (403 without browser cookies) — the CDN is public and CORS-enabled.
 */
export async function fetchProductMedia(
  nmId: number,
  routes: CdnRoutes,
  options?: RequestOptions,
): Promise<ProductMedia> {
  try {
    const mediaBaseUrl = productMediaBaseUrl(nmId, routes.media);
    const response = await fetchJson(productCardInfoUrl(mediaBaseUrl), options);
    const card = productCardSchema.parse(response);
    const videoBaseUrl = card.media.has_video ? productVideoBaseUrl(nmId, routes.video) : null;

    return toProductMedia(nmId, card, { mediaBaseUrl, videoBaseUrl });
  } catch (error) {
    // Unknown basket (id beyond known ranges) or missing card both mean "no such product".
    if (error instanceof CdnHostNotFoundError || isHttpError(error, 404)) {
      throw new ProductNotFoundError(nmId, { cause: error });
    }
    throw error;
  }
}

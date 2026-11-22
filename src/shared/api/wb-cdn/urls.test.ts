import { describe, expect, it } from 'vitest';

import { CdnHostNotFoundError, ImageSize, type HostRange } from './model';
import {
  productCardInfoUrl,
  productImageUrl,
  productMediaBaseUrl,
  productVideoBaseUrl,
  productVideoPlaylistUrl,
  resolveHost,
} from './urls';

// Real ranges from https://cdn.wbbasket.ru/api/v3/upstreams (trimmed).
const MEDIA_RANGES: HostRange[] = [
  { from: 0, to: 143, host: 'basket-01.wbbasket.ru' },
  { from: 5814, to: 6125, host: 'basket-30.wbbasket.ru' },
];
const VIDEO_RANGES: HostRange[] = [
  { from: 0, to: 11, host: 'videonme-basket-01.wbbasket.ru' },
  { from: 108, to: 119, host: 'videonme-basket-10.wbbasket.ru' },
];

// Example product from the task: https://www.wildberries.ru/catalog/604174866/detail.aspx
const NM_ID = 604174866;

describe('resolveHost', () => {
  it('treats range bounds as inclusive', () => {
    expect(resolveHost(5814, MEDIA_RANGES)).toBe('basket-30.wbbasket.ru');
    expect(resolveHost(6125, MEDIA_RANGES)).toBe('basket-30.wbbasket.ru');
    expect(resolveHost(0, MEDIA_RANGES)).toBe('basket-01.wbbasket.ru');
  });

  it('throws CdnHostNotFoundError for an unknown volume', () => {
    expect(() => resolveHost(6126, MEDIA_RANGES)).toThrow(CdnHostNotFoundError);
  });
});

describe('product media URLs', () => {
  const mediaBase = productMediaBaseUrl(NM_ID, MEDIA_RANGES);

  it('builds the media base URL (vol = nm / 1e5, part = nm / 1e3)', () => {
    expect(mediaBase).toBe('https://basket-30.wbbasket.ru/vol6041/part604174/604174866');
  });

  it('builds the card info URL', () => {
    expect(productCardInfoUrl(mediaBase)).toBe(
      'https://basket-30.wbbasket.ru/vol6041/part604174/604174866/info/ru/card.json',
    );
  });

  it('builds photo URLs with 1-based index and size', () => {
    expect(productImageUrl(mediaBase, 1, ImageSize.Big)).toBe(
      'https://basket-30.wbbasket.ru/vol6041/part604174/604174866/images/big/1.webp',
    );
    expect(productImageUrl(mediaBase, 20, ImageSize.Medium)).toBe(
      'https://basket-30.wbbasket.ru/vol6041/part604174/604174866/images/c246x328/20.webp',
    );
  });

  it('rejects a non-positive photo index', () => {
    expect(() => productImageUrl(mediaBase, 0, ImageSize.Big)).toThrow(RangeError);
    expect(() => productImageUrl(mediaBase, 1.5, ImageSize.Big)).toThrow(RangeError);
  });

  it('pads nothing for small ids (vol 0 / part 0)', () => {
    expect(productMediaBaseUrl(12345, MEDIA_RANGES)).toBe(
      'https://basket-01.wbbasket.ru/vol0/part12/12345',
    );
  });
});

describe('product video URLs', () => {
  it('builds the video base URL (vol = nm % 144, part = nm / 1e4)', () => {
    expect(productVideoBaseUrl(NM_ID, VIDEO_RANGES)).toBe(
      'https://videonme-basket-10.wbbasket.ru/vol114/part60417/604174866',
    );
  });

  it('builds the HLS playlist URL', () => {
    const videoBase = productVideoBaseUrl(NM_ID, VIDEO_RANGES);

    expect(productVideoPlaylistUrl(videoBase, '1440p')).toBe(
      'https://videonme-basket-10.wbbasket.ru/vol114/part60417/604174866/hls/1440p/index.m3u8',
    );
  });
});

import { unzipSync } from 'fflate';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProductPhoto } from '@/entities/product';

import { buildPhotosArchive, photoFileName } from './build-photos-archive';

const NM_ID = 592995535;

const photo = (index: number): ProductPhoto => ({
  index,
  previewUrl: `https://cdn.test/c246x328/${index}.webp`,
  downloadUrl: `https://cdn.test/big/${index}.webp`,
});

function stubCdn() {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const index = /\/(\d+)\.webp$/.exec(String(input))?.[1] ?? '0';
    return new Response(new Uint8Array([Number(index), 0xff]));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const context = (signal = new AbortController().signal) => ({ signal, onProgress: vi.fn() });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('photoFileName', () => {
  it('pads the index so files sort in WB order', () => {
    expect(photoFileName(NM_ID, 3, 21)).toBe('592995535_03.webp');
    expect(photoFileName(NM_ID, 21, 21)).toBe('592995535_21.webp');
    expect(photoFileName(NM_ID, 7, 120)).toBe('592995535_007.webp');
  });
});

describe('buildPhotosArchive', () => {
  it('zips only the requested photos with their original bytes', async () => {
    const fetchMock = stubCdn();

    const { blob, fileName } = await buildPhotosArchive(
      { nmId: NM_ID, photos: [photo(1), photo(3)] },
      context(),
    );
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));

    expect(fileName).toBe('592995535_photos.zip');
    expect(blob.type).toBe('application/zip');
    expect(Object.keys(files)).toEqual(['592995535_01.webp', '592995535_03.webp']);
    expect(files['592995535_03.webp']).toEqual(new Uint8Array([3, 0xff]));
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      'https://cdn.test/big/1.webp',
      'https://cdn.test/big/3.webp',
    ]);
  });

  it('reports progress as a fraction', async () => {
    stubCdn();
    const ctx = context();

    await buildPhotosArchive({ nmId: NM_ID, photos: [photo(1), photo(2)] }, ctx);

    expect(ctx.onProgress.mock.calls).toEqual([[0.5], [1]]);
  });

  it('fails when any photo fails, without producing a partial archive', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(new Uint8Array([1])))
        .mockResolvedValueOnce(new Response('gone', { status: 404 })),
    );

    await expect(
      buildPhotosArchive({ nmId: NM_ID, photos: [photo(1), photo(2)] }, context()),
    ).rejects.toMatchObject({ name: 'HttpError', status: 404 });
  });

  it('stops when cancelled', async () => {
    stubCdn();

    await expect(
      buildPhotosArchive({ nmId: NM_ID, photos: [photo(1)] }, context(AbortSignal.abort())),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

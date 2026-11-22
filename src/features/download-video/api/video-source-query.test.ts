import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchVideoSource } from './video-source-query';

const VIDEO_BASE = 'https://videonme-basket-10.wbbasket.ru/vol114/part60417/604174866';
const PLAYLIST = '#EXTM3U\n#EXTINF:2.5\n1.ts\n#EXTINF:1.5\n2.ts\n#EXT-X-ENDLIST';

/** Serves the playlist for `available` qualities and `status` for the rest. */
function stubVideoCdn(available: string[], status = 404) {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async (input) => {
      const quality = /\/hls\/(\w+)\/index\.m3u8$/.exec(String(input))?.[1] ?? '';
      return available.includes(quality)
        ? new Response(PLAYLIST)
        : new Response('error', { status });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchVideoSource', () => {
  it('picks the best available quality', async () => {
    stubVideoCdn(['1080p', '720p']);

    const source = await fetchVideoSource(VIDEO_BASE);

    expect(source).toMatchObject({ quality: '1080p', durationSec: 4 });
    expect(source?.segmentUrls).toEqual([
      `${VIDEO_BASE}/hls/1080p/1.ts`,
      `${VIDEO_BASE}/hls/1080p/2.ts`,
    ]);
  });

  it('uses the only rendition WB usually has (1440p)', async () => {
    stubVideoCdn(['1440p']);

    await expect(fetchVideoSource(VIDEO_BASE)).resolves.toMatchObject({ quality: '1440p' });
  });

  it('returns null when every quality is 404', async () => {
    stubVideoCdn([]);

    await expect(fetchVideoSource(VIDEO_BASE)).resolves.toBeNull();
  });

  it('throws when nothing is available and the CDN is failing', async () => {
    stubVideoCdn([], 503);

    await expect(fetchVideoSource(VIDEO_BASE)).rejects.toMatchObject({ status: 503 });
  });
});

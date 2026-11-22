import { afterEach, describe, expect, it, vi } from 'vitest';

import { remuxTsToMp4 } from '../lib/remux-to-mp4';
import { buildVideoFile } from './build-video-file';

vi.mock('../lib/remux-to-mp4', () => ({
  remuxTsToMp4: vi.fn(
    async (_ts: Uint8Array, { onProgress }: { onProgress: (f: number) => void }) => {
      onProgress(1);
      return new Blob(['mp4'], { type: 'video/mp4' });
    },
  ),
}));

const SOURCE = {
  quality: '1440p' as const,
  durationSec: 4,
  segmentUrls: ['https://cdn.test/1.ts', 'https://cdn.test/2.ts'],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('buildVideoFile', () => {
  it('downloads segments, concatenates them in order and remuxes into an mp4', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) =>
        String(input).endsWith('1.ts')
          ? new Response(new Uint8Array([1, 1]))
          : new Response(new Uint8Array([2])),
      ),
    );
    const onProgress = vi.fn();

    const result = await buildVideoFile(
      { nmId: 604174866, source: SOURCE },
      { signal: new AbortController().signal, onProgress },
    );

    expect(result.fileName).toBe('604174866_1440p.mp4');
    expect(result.blob.type).toBe('video/mp4');
    expect(vi.mocked(remuxTsToMp4).mock.calls[0]?.[0]).toEqual(new Uint8Array([1, 1, 2]));
    expect(onProgress.mock.calls.map(([fraction]) => fraction)).toEqual([0.45, 0.9, 1]);
  });

  it('does not remux when a segment fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response('gone', { status: 404 })),
    );

    await expect(
      buildVideoFile(
        { nmId: 604174866, source: SOURCE },
        { signal: new AbortController().signal, onProgress: vi.fn() },
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(remuxTsToMp4).not.toHaveBeenCalled();
  });
});

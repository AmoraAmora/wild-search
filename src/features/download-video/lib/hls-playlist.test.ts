import { describe, expect, it } from 'vitest';

import { UnsupportedVideoError } from '../model/errors';
import { parseMediaPlaylist } from './hls-playlist';

const PLAYLIST_URL =
  'https://videonme-basket-10.wbbasket.ru/vol114/part60417/604174866/hls/1440p/index.m3u8';

// Real playlist of the example product.
const WB_PLAYLIST = `#EXTM3U
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-TARGETDURATION:5
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:4.433
1.ts
#EXTINF:2.6
2.ts
#EXTINF:2.866
3.ts
#EXTINF:1.533
4.ts
#EXT-X-ENDLIST
`;

describe('parseMediaPlaylist', () => {
  it('resolves segment URLs relative to the playlist and sums durations', () => {
    const { segmentUrls, durationSec } = parseMediaPlaylist(WB_PLAYLIST, PLAYLIST_URL);

    expect(segmentUrls).toEqual(
      ['1.ts', '2.ts', '3.ts', '4.ts'].map((name) => PLAYLIST_URL.replace('index.m3u8', name)),
    );
    expect(durationSec).toBeCloseTo(11.432);
  });

  it('handles CRLF line endings and absolute segment URLs', () => {
    const playlist = '#EXTM3U\r\n#EXTINF:1,\r\nhttps://cdn.test/a.ts\r\n';

    expect(parseMediaPlaylist(playlist, PLAYLIST_URL).segmentUrls).toEqual([
      'https://cdn.test/a.ts',
    ]);
  });

  it.each([
    ['not a playlist', '<html>Not found</html>'],
    ['a master playlist', '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\n1440p/index.m3u8'],
    ['encrypted segments', '#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="k"\n#EXTINF:1\n1.ts'],
    ['fMP4 segments', '#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:1\n1.m4s'],
    ['no segments', '#EXTM3U\n#EXT-X-ENDLIST'],
  ])('rejects %s', (_case, playlist) => {
    expect(() => parseMediaPlaylist(playlist, PLAYLIST_URL)).toThrow(UnsupportedVideoError);
  });

  it('accepts an explicit METHOD=NONE key', () => {
    const playlist = '#EXTM3U\n#EXT-X-KEY:METHOD=NONE\n#EXTINF:1\n1.ts';

    expect(parseMediaPlaylist(playlist, PLAYLIST_URL).segmentUrls).toHaveLength(1);
  });
});

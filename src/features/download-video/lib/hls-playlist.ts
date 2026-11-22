import { UnsupportedVideoError } from '../model/errors';

export type MediaPlaylist = {
  /** Absolute segment URLs, in playback order. */
  segmentUrls: string[];
  durationSec: number;
};

const EXTINF_PATTERN = /^#EXTINF:([\d.]+)/;

/**
 * Parses an HLS media playlist as served by the WB video CDN (VOD, MPEG-TS segments).
 * Fails explicitly on playlist features the MP4 remux can't handle instead of
 * producing a broken file.
 */
export function parseMediaPlaylist(text: string, playlistUrl: string): MediaPlaylist {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines[0] !== '#EXTM3U') {
    throw new UnsupportedVideoError('not an HLS playlist');
  }

  const segmentUrls: string[] = [];
  let durationSec = 0;

  for (const line of lines) {
    if (line.startsWith('#EXT-X-STREAM-INF')) {
      throw new UnsupportedVideoError('master playlist instead of a media playlist');
    }
    if (line.startsWith('#EXT-X-KEY') && !line.includes('METHOD=NONE')) {
      throw new UnsupportedVideoError('encrypted segments');
    }
    if (line.startsWith('#EXT-X-MAP')) {
      throw new UnsupportedVideoError('fragmented MP4 segments');
    }

    const extinf = EXTINF_PATTERN.exec(line);
    if (extinf?.[1]) {
      durationSec += Number(extinf[1]);
    } else if (!line.startsWith('#')) {
      segmentUrls.push(new URL(line, playlistUrl).href);
    }
  }

  if (segmentUrls.length === 0) {
    throw new UnsupportedVideoError('playlist has no segments');
  }

  return { segmentUrls, durationSec };
}

import { CdnHostNotFoundError, type HostRange, type ImageSize, type VideoQuality } from './model';

/*
 * URL formulas reverse-engineered from the WB frontend
 * (see https://gist.github.com/sheldhur/50420d0b85b2c80bc02cf96550b50625).
 * Photos and videos are sharded differently, hence two base-URL builders.
 */

export function resolveHost(vol: number, ranges: readonly HostRange[]): string {
  const route = ranges.find(({ from, to }) => vol >= from && vol <= to);

  if (!route) {
    throw new CdnHostNotFoundError(vol);
  }

  return route.host;
}

/** Base URL for card info and photos: `https://<basket>/vol<nm/1e5>/part<nm/1e3>/<nm>`. */
export function productMediaBaseUrl(nmId: number, mediaRanges: readonly HostRange[]): string {
  const vol = Math.floor(nmId / 1e5);
  const part = Math.floor(nmId / 1e3);
  const host = resolveHost(vol, mediaRanges);

  return `https://${host}/vol${vol}/part${part}/${nmId}`;
}

/** Base URL for videos: `https://<videonme>/vol<nm%144>/part<nm/1e4>/<nm>`. */
export function productVideoBaseUrl(nmId: number, videoRanges: readonly HostRange[]): string {
  const vol = nmId % 144;
  const part = Math.floor(nmId / 1e4);
  const host = resolveHost(vol, videoRanges);

  return `https://${host}/vol${vol}/part${part}/${nmId}`;
}

export function productCardInfoUrl(mediaBaseUrl: string): string {
  return `${mediaBaseUrl}/info/ru/card.json`;
}

/** Photo URL; `index` is 1-based, matching WB numbering. */
export function productImageUrl(mediaBaseUrl: string, index: number, size: ImageSize): string {
  if (!Number.isInteger(index) || index < 1) {
    throw new RangeError(`Photo index must be a positive integer, got ${index}`);
  }

  return `${mediaBaseUrl}/images/${size}/${index}.webp`;
}

/** HLS media playlist; segment URLs inside it are relative to this URL. */
export function productVideoPlaylistUrl(videoBaseUrl: string, quality: VideoQuality): string {
  return `${videoBaseUrl}/hls/${quality}/index.m3u8`;
}

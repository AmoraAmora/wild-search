import { queryOptions, skipToken } from '@tanstack/react-query';

import {
  fetchText,
  isHttpError,
  productVideoPlaylistUrl,
  VIDEO_QUALITIES,
  type RequestOptions,
  type VideoQuality,
} from '@/shared/api';

import { parseMediaPlaylist, type MediaPlaylist } from '../lib/hls-playlist';

export type VideoSource = MediaPlaylist & {
  quality: VideoQuality;
};

/**
 * Finds the best rendition the CDN actually has. The set differs per product
 * (often only 1440p exists), so all candidates are probed in parallel — playlists
 * are tiny — and the best available one wins. Returns `null` if none exists.
 */
export async function fetchVideoSource(
  videoBaseUrl: string,
  options?: RequestOptions,
): Promise<VideoSource | null> {
  const attempts = await Promise.allSettled(
    VIDEO_QUALITIES.map(async (quality) => {
      const playlistUrl = productVideoPlaylistUrl(videoBaseUrl, quality);
      const playlist = await fetchText(playlistUrl, options);
      return { quality, ...parseMediaPlaylist(playlist, playlistUrl) };
    }),
  );

  // VIDEO_QUALITIES is ordered best first, so the first success is the best one.
  for (const attempt of attempts) {
    if (attempt.status === 'fulfilled') {
      return attempt.value;
    }
  }

  // Nothing worked: "not found everywhere" means no video; anything else is a real failure.
  const failure = attempts.find(
    (attempt) => attempt.status === 'rejected' && !isHttpError(attempt.reason, 404),
  );
  if (failure?.status === 'rejected') {
    throw failure.reason;
  }

  return null;
}

export const videoSourceQueryOptions = (videoBaseUrl: string | null) =>
  queryOptions({
    queryKey: ['video-source', videoBaseUrl] as const,
    queryFn:
      videoBaseUrl === null
        ? skipToken
        : ({ signal }) => fetchVideoSource(videoBaseUrl, { signal }),
    staleTime: Infinity,
  });

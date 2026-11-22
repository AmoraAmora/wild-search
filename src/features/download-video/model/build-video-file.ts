import { fetchBytes } from '@/shared/api';
import { MEDIA_DOWNLOAD_CONCURRENCY } from '@/shared/config';
import {
  concatBytes,
  mapWithConcurrency,
  type DownloadResult,
  type DownloadTaskContext,
} from '@/shared/lib';

import type { VideoSource } from '../api/video-source-query';
import { remuxTsToMp4 } from '../lib/remux-to-mp4';

export type VideoFileRequest = {
  nmId: number;
  source: VideoSource;
};

/** Share of the progress bar for downloading; the rest is the (much faster) remux. */
const DOWNLOAD_SHARE = 0.9;

export async function buildVideoFile(
  { nmId, source }: VideoFileRequest,
  { signal, onProgress }: DownloadTaskContext,
): Promise<DownloadResult> {
  const segments = await mapWithConcurrency(
    source.segmentUrls,
    (url, _index, taskSignal) => fetchBytes(url, { signal: taskSignal }),
    {
      concurrency: MEDIA_DOWNLOAD_CONCURRENCY,
      signal,
      onProgress: (completed, total) => onProgress((completed / total) * DOWNLOAD_SHARE),
    },
  );

  // MPEG-TS segments of one rendition form a valid stream when simply concatenated.
  const blob = await remuxTsToMp4(concatBytes(segments), {
    signal,
    onProgress: (fraction) => onProgress(DOWNLOAD_SHARE + fraction * (1 - DOWNLOAD_SHARE)),
  });

  return { blob, fileName: `${nmId}_${source.quality}.mp4` };
}

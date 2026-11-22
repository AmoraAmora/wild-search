import type { Zippable } from 'fflate';

import type { ProductPhoto } from '@/entities/product';
import { fetchBytes } from '@/shared/api';
import { MEDIA_DOWNLOAD_CONCURRENCY } from '@/shared/config';
import { mapWithConcurrency, type DownloadResult, type DownloadTaskContext } from '@/shared/lib';

export type PhotosArchiveRequest = {
  nmId: number;
  photos: readonly ProductPhoto[];
};

/** Zero-padded so files sort in WB order in any file manager: `…_01.webp`, `…_02.webp`. */
export function photoFileName(nmId: number, index: number, total: number): string {
  const width = Math.max(2, String(total).length);
  return `${nmId}_${String(index).padStart(width, '0')}.webp`;
}

export async function buildPhotosArchive(
  { nmId, photos }: PhotosArchiveRequest,
  { signal, onProgress }: DownloadTaskContext,
): Promise<DownloadResult> {
  const entries = await mapWithConcurrency(
    photos,
    async (photo, _index, taskSignal) =>
      [
        photoFileName(nmId, photo.index, photos.length),
        await fetchBytes(photo.downloadUrl, { signal: taskSignal }),
      ] as const,
    {
      concurrency: MEDIA_DOWNLOAD_CONCURRENCY,
      signal,
      onProgress: (completed, total) => onProgress(completed / total),
    },
  );

  // Loaded on first use: zipping is only needed at the very end of a download.
  const { zipSync } = await import('fflate');
  signal.throwIfAborted();

  // WebP is already compressed: storing (level 0) keeps the archive the same size
  // and makes zipping a plain memory copy, cheap enough for the main thread.
  const archive = zipSync(Object.fromEntries(entries) satisfies Zippable, { level: 0 });

  return {
    blob: new Blob([archive], { type: 'application/zip' }),
    fileName: `${nmId}_photos.zip`,
  };
}

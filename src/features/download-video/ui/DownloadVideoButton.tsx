import MovieIcon from '@mui/icons-material/Movie';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { useQuery } from '@tanstack/react-query';

import { getErrorMessage, useFileDownload } from '@/shared/lib';
import { ErrorSnackbar } from '@/shared/ui';

import { videoSourceQueryOptions } from '../api/video-source-query';
import { buildVideoFile } from '../model/build-video-file';
import { UnsupportedVideoError } from '../model/errors';

type DownloadVideoButtonProps = {
  nmId: number;
  /** From the product card; `null` when the product has no video. */
  videoBaseUrl: string | null;
};

function describeError(error: unknown): string {
  return error instanceof UnsupportedVideoError
    ? 'Видео этого товара в неподдерживаемом формате.'
    : getErrorMessage(error);
}

export function DownloadVideoButton({ nmId, videoBaseUrl }: DownloadVideoButtonProps) {
  const sourceQuery = useQuery(videoSourceQueryOptions(videoBaseUrl));
  const { download, isPending, percent, error, resetError } = useFileDownload(buildVideoFile);

  const source = sourceQuery.data ?? null;
  const isResolving = videoBaseUrl !== null && sourceQuery.isPending;

  let unavailableReason: string | null = null;
  if (videoBaseUrl === null || (sourceQuery.isSuccess && source === null)) {
    unavailableReason = 'У товара нет видео';
  } else if (sourceQuery.isError) {
    unavailableReason = describeError(sourceQuery.error);
  }

  const label = isPending
    ? `Обработка… ${percent}%`
    : source
      ? `Скачать видео (${source.quality})`
      : 'Скачать видео';

  return (
    <>
      <Tooltip title={unavailableReason ?? ''}>
        {/* Disabled buttons swallow pointer events; the span keeps the tooltip working. */}
        <span>
          <Button
            variant="outlined"
            startIcon={isResolving ? <CircularProgress size={18} /> : <MovieIcon />}
            disabled={source === null || isPending}
            onClick={() => source && download({ nmId, source })}
          >
            {label}
          </Button>
        </span>
      </Tooltip>
      <ErrorSnackbar message={error ? describeError(error) : null} onClose={resetError} />
    </>
  );
}

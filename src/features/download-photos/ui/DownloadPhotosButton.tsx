import DownloadIcon from '@mui/icons-material/Download';
import Button from '@mui/material/Button';

import type { ProductPhoto } from '@/entities/product';
import { getErrorMessage, useFileDownload } from '@/shared/lib';
import { ErrorSnackbar } from '@/shared/ui';

import { buildPhotosArchive } from '../model/build-photos-archive';

type DownloadPhotosButtonProps = {
  nmId: number;
  photos: readonly ProductPhoto[];
  fullWidth?: boolean;
};

export function DownloadPhotosButton({
  nmId,
  photos,
  fullWidth = false,
}: DownloadPhotosButtonProps) {
  const { download, isPending, percent, error, resetError } = useFileDownload(buildPhotosArchive);

  return (
    <>
      <Button
        variant="contained"
        fullWidth={fullWidth}
        startIcon={<DownloadIcon />}
        disabled={isPending || photos.length === 0}
        onClick={() => download({ nmId, photos })}
      >
        {isPending ? `Скачивание… ${percent}%` : `Скачать фото (${photos.length})`}
      </Button>
      <ErrorSnackbar message={error ? getErrorMessage(error) : null} onClose={resetError} />
    </>
  );
}

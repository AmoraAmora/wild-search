import CloseIcon from '@mui/icons-material/Close';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { useQuery } from '@tanstack/react-query';

import { productMediaQueryOptions, ProductNotFoundError } from '@/entities/product';
import { getErrorMessage } from '@/shared/lib';

import { PhotoGridSkeleton } from './PhotoGrid';
import { ProductMediaPicker } from './ProductMediaPicker';

type MediaDownloadModalProps = {
  nmId: number;
  open: boolean;
  onClose: () => void;
};

const TITLE_ID = 'media-download-modal-title';

export function MediaDownloadModal({ nmId, open, onClose }: MediaDownloadModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-labelledby={TITLE_ID}>
      <DialogTitle id={TITLE_ID} sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
        <PhotoLibraryOutlinedIcon color="primary" />
        Скачать фотографии
      </DialogTitle>
      <IconButton
        aria-label="Закрыть"
        onClick={onClose}
        sx={{ position: 'absolute', right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent>
        {/* Dialog unmounts its content when closed: running downloads are cancelled. */}
        <ProductMediaContent nmId={nmId} />
      </DialogContent>
    </Dialog>
  );
}

function ProductMediaContent({ nmId }: { nmId: number }) {
  const { data, error, isPending, isError, isRefetching, refetch } = useQuery(
    productMediaQueryOptions(nmId),
  );

  if (isPending) {
    return <PhotoGridSkeleton />;
  }

  if (isError) {
    if (error instanceof ProductNotFoundError) {
      return (
        <Alert severity="warning">
          Товар с артикулом {nmId} не найден. Проверьте артикул или ссылку.
        </Alert>
      );
    }

    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" disabled={isRefetching} onClick={() => refetch()}>
            Повторить
          </Button>
        }
      >
        {getErrorMessage(error)}
      </Alert>
    );
  }

  return <ProductMediaPicker key={data.nmId} product={data} />;
}

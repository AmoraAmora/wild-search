import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { lazy, Suspense, useState, type FormEvent } from 'react';

import { parseArticle } from '@/entities/product';

/**
 * The modal (dialog, photo grid, download features) is not needed for the first paint.
 * It is split into its own chunk and preloaded as soon as the input is focused,
 * so it is ready by the time the user submits.
 */
const loadMediaDownloadModal = () => import('@/widgets/media-download-modal');
const MediaDownloadModal = lazy(() =>
  loadMediaDownloadModal().then((module) => ({ default: module.MediaDownloadModal })),
);
const preloadMediaDownloadModal = () => {
  // A failed preload is retried by React.lazy on render, where the error is handled.
  loadMediaDownloadModal().catch(() => undefined);
};

const INVALID_INPUT_MESSAGE = 'Введите артикул (только цифры) или ссылку на товар';

type ModalState = {
  nmId: number;
  open: boolean;
};

export function HomePage() {
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  // nmId outlives `open` so the dialog keeps its content during the close animation.
  const [modal, setModal] = useState<ModalState | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nmId = parseArticle(input);

    if (nmId === null) {
      setInputError(INVALID_INPUT_MESSAGE);
      return;
    }

    setInputError(null);
    setModal({ nmId, open: true });
  };

  const handleClose = () => setModal((current) => current && { ...current, open: false });

  return (
    <Container component="main" maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Скачать фото и видео с Wildberries
      </Typography>

      <Stack
        component="form"
        noValidate
        onSubmit={handleSubmit}
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ alignItems: { sm: 'flex-start' } }}
      >
        <TextField
          label="Артикул или ссылка"
          placeholder="592995535"
          size="small"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setInputError(null);
          }}
          onFocus={preloadMediaDownloadModal}
          error={inputError !== null}
          helperText={inputError}
          autoFocus
          sx={{ minWidth: { sm: 320 } }}
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<FileDownloadOutlinedIcon />}
          sx={{ height: 40, whiteSpace: 'nowrap' }}
        >
          Скачать фото и видео
        </Button>
      </Stack>

      {modal && (
        <Suspense fallback={null}>
          <MediaDownloadModal nmId={modal.nmId} open={modal.open} onClose={handleClose} />
        </Suspense>
      )}
    </Container>
  );
}

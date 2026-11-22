import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
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

/** Real products that cover the main cases, so the app can be tried in one click. */
const EXAMPLES = [
  { nmId: 592995535, label: 'Кроссовки' },
  { nmId: 604174866, label: 'Джинсы' },
  { nmId: 600000001, label: 'Без видео' },
] as const;

type ModalState = {
  nmId: number;
  open: boolean;
};

export function HomePage() {
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  // nmId outlives `open` so the dialog keeps its content during the close animation.
  const [modal, setModal] = useState<ModalState | null>(null);

  const openProduct = (nmId: number) => {
    setInputError(null);
    setModal({ nmId, open: true });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nmId = parseArticle(input);

    if (nmId === null) {
      setInputError(INVALID_INPUT_MESSAGE);
      return;
    }

    openProduct(nmId);
  };

  const handleExample = (nmId: number) => {
    setInput(String(nmId));
    openProduct(nmId);
  };

  const handleClose = () => setModal((current) => current && { ...current, open: false });

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(ellipse at top, #ece3ff 0%, transparent 60%)',
      }}
    >
      <Container
        maxWidth={false}
        sx={{ maxWidth: 720, flex: 1, display: 'flex', alignItems: 'center', py: 6 }}
      >
        <Stack spacing={3} sx={{ width: '100%', alignItems: 'center', textAlign: 'center' }}>
          <Box
            aria-hidden
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              display: 'grid',
              placeItems: 'center',
              color: 'primary.contrastText',
              bgcolor: 'primary.main',
            }}
          >
            <FileDownloadOutlinedIcon fontSize="large" />
          </Box>

          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Фото и видео с Wildberries
            </Typography>
            <Typography color="text.secondary">
              Вставьте артикул или ссылку на товар — скачайте фотографии одним архивом и видео в
              MP4.
            </Typography>
          </Box>

          <Paper
            component="form"
            noValidate
            onSubmit={handleSubmit}
            variant="outlined"
            sx={{ p: 1.5, width: '100%', borderRadius: 2, textAlign: 'left' }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                fullWidth
                placeholder="592995535 или ссылка на товар"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setInputError(null);
                }}
                onFocus={preloadMediaDownloadModal}
                error={inputError !== null}
                helperText={inputError}
                autoFocus
                slotProps={{ htmlInput: { 'aria-label': 'Артикул или ссылка на товар' } }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<FileDownloadOutlinedIcon />}
                sx={{ height: 56, px: 3, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Скачать фото и видео
              </Button>
            </Stack>
          </Paper>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}
          >
            <Typography variant="body2" color="text.secondary">
              Попробуйте:
            </Typography>
            {EXAMPLES.map(({ nmId, label }) => (
              <Chip
                key={nmId}
                label={`${label} · ${nmId}`}
                variant="outlined"
                onClick={() => handleExample(nmId)}
                onMouseEnter={preloadMediaDownloadModal}
              />
            ))}
          </Stack>
        </Stack>
      </Container>

      <Typography
        component="footer"
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: 'center', py: 2, px: 2 }}
      >
        Неофициальный инструмент. Фото и видео загружаются напрямую с CDN Wildberries.
      </Typography>

      {modal && (
        <Suspense fallback={null}>
          <MediaDownloadModal nmId={modal.nmId} open={modal.open} onClose={handleClose} />
        </Suspense>
      )}
    </Box>
  );
}

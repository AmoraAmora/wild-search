import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import type { ProductMedia } from '@/entities/product';
import { DownloadPhotosButton } from '@/features/download-photos';
import { DownloadVideoButton } from '@/features/download-video';
import { SelectablePhoto, SelectAllCheckbox, usePhotoSelection } from '@/features/select-photos';

import { PhotoGrid } from './PhotoGrid';
import { ProductHeader } from './ProductHeader';

type ProductMediaPickerProps = {
  product: ProductMedia;
};

/** Mount with `key={product.nmId}` so the selection starts fresh for every product. */
export function ProductMediaPicker({ product }: ProductMediaPickerProps) {
  const { selection, selectedPhotos, selectAllState, toggle, toggleAll } = usePhotoSelection(
    product.photos,
  );
  const total = product.photos.length;
  const isPhone = useMediaQuery(useTheme().breakpoints.down('sm'));

  return (
    // `useFlexGap`: spacing via `gap`, so the sticky bar's negative margins aren't overridden.
    <Stack spacing={2} useFlexGap>
      <ProductHeader product={product} />

      {/* Sticky within the dialog's scroll area: actions stay reachable while browsing photos. */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          mx: -3,
          px: 3,
          py: 1.5,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          {total > 0 ? (
            <Stack direction="row" sx={{ alignItems: 'center' }}>
              <SelectAllCheckbox state={selectAllState} onToggle={toggleAll} />
              <Typography variant="body2" color="text.secondary">
                Выбрано {selectedPhotos.length} из {total}
              </Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary">У товара нет фотографий.</Typography>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <DownloadPhotosButton nmId={product.nmId} photos={selectedPhotos} fullWidth={isPhone} />
            <DownloadVideoButton
              nmId={product.nmId}
              videoBaseUrl={product.videoBaseUrl}
              fullWidth={isPhone}
            />
          </Stack>
        </Stack>
      </Box>

      {total > 0 && (
        <PhotoGrid>
          {product.photos.map((photo) => (
            <SelectablePhoto
              key={photo.index}
              photo={photo}
              selected={selection.has(photo.index)}
              onToggle={toggle}
            />
          ))}
        </PhotoGrid>
      )}
    </Stack>
  );
}

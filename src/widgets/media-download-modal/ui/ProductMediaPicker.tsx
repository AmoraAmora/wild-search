import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { ProductMedia } from '@/entities/product';
import { DownloadPhotosButton } from '@/features/download-photos';
import { DownloadVideoButton } from '@/features/download-video';
import { SelectablePhoto, SelectAllCheckbox, usePhotoSelection } from '@/features/select-photos';

import { PhotoGrid } from './PhotoGrid';

type ProductMediaPickerProps = {
  product: ProductMedia;
};

/** Mount with `key={product.nmId}` so the selection starts fresh for every product. */
export function ProductMediaPicker({ product }: ProductMediaPickerProps) {
  const { selection, selectedPhotos, selectAllState, toggle, toggleAll } = usePhotoSelection(
    product.photos,
  );
  const hasPhotos = product.photos.length > 0;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {product.name} · арт. {product.nmId}
      </Typography>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <DownloadPhotosButton nmId={product.nmId} photos={selectedPhotos} />
        <DownloadVideoButton nmId={product.nmId} videoBaseUrl={product.videoBaseUrl} />
      </Stack>

      {hasPhotos ? (
        <>
          <SelectAllCheckbox state={selectAllState} onToggle={toggleAll} />
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
        </>
      ) : (
        <Typography color="text.secondary">У товара нет фотографий.</Typography>
      )}
    </Stack>
  );
}

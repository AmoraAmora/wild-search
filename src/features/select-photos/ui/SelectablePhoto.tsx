import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import { memo } from 'react';

import type { ProductPhoto } from '@/entities/product';

type SelectablePhotoProps = {
  photo: ProductPhoto;
  selected: boolean;
  /** Receives the photo index, so the parent can pass one stable callback to every tile. */
  onToggle: (index: number) => void;
};

export const SelectablePhoto = memo(function SelectablePhoto({
  photo,
  selected,
  onToggle,
}: SelectablePhotoProps) {
  return (
    <Box
      component="label"
      sx={{
        position: 'relative',
        display: 'block',
        aspectRatio: '3 / 4',
        borderRadius: 1,
        overflow: 'hidden',
        cursor: 'pointer',
        outline: 2,
        outlineColor: selected ? 'primary.main' : 'transparent',
        outlineOffset: -2,
        bgcolor: 'action.hover',
      }}
    >
      <Box
        component="img"
        src={photo.previewUrl}
        alt={`Фото ${photo.index}`}
        loading="lazy"
        decoding="async"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: selected ? 1 : 0.6,
        }}
      />
      <Checkbox
        checked={selected}
        onChange={() => onToggle(photo.index)}
        size="small"
        slotProps={{ input: { 'aria-label': `Выбрать фото ${photo.index}` } }}
        sx={{
          position: 'absolute',
          top: 4,
          left: 4,
          p: 0.25,
          bgcolor: 'background.paper',
          borderRadius: 0.5,
          '&:hover': { bgcolor: 'background.paper' },
        }}
      />
    </Box>
  );
});

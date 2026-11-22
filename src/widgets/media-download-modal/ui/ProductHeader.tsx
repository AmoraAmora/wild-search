import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { ProductMedia } from '@/entities/product';

type ProductHeaderProps = {
  product: ProductMedia;
};

export function ProductHeader({ product }: ProductHeaderProps) {
  const cover = product.photos[0];
  const meta = [product.brand, `арт. ${product.nmId}`].filter(Boolean).join(' · ');

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      {cover && (
        <Box
          component="img"
          src={cover.previewUrl}
          alt=""
          sx={{
            width: 48,
            aspectRatio: '3 / 4',
            objectFit: 'cover',
            borderRadius: 1,
            flexShrink: 0,
            bgcolor: 'action.hover',
          }}
        />
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 600,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {meta}
        </Typography>
      </Box>
    </Stack>
  );
}

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import type { ReactNode } from 'react';

type PhotoGridProps = {
  children: ReactNode;
};

/** Responsive grid of 3:4 tiles: 3 per row on phones, as many ≥120px tiles as fit otherwise. */
export function PhotoGrid({ children }: PhotoGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(auto-fill, minmax(120px, 1fr))' },
        gap: 1,
      }}
    >
      {children}
    </Box>
  );
}

const SKELETON_TILES = 12;

export function PhotoGridSkeleton() {
  return (
    <PhotoGrid>
      {Array.from({ length: SKELETON_TILES }, (_, index) => (
        <Skeleton
          key={index}
          variant="rounded"
          sx={{ width: '100%', height: 'auto', aspectRatio: '3 / 4' }}
        />
      ))}
    </PhotoGrid>
  );
}

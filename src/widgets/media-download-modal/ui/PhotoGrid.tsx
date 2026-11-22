import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import type { ReactNode } from 'react';

type PhotoGridProps = {
  children: ReactNode;
};

/** Responsive grid: as many 3:4 tiles per row as fit, at least 120px wide. */
export function PhotoGrid({ children }: PhotoGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
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

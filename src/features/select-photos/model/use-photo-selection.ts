import { useCallback, useMemo, useState } from 'react';

import type { ProductPhoto } from '@/entities/product';

import { getSelectAllState, selectAll, toggleAll, toggleOne, type Selection } from './selection';

/**
 * Photo selection, all photos selected initially. Reset it for a new product by
 * remounting the owner (e.g. `key={nmId}`) rather than syncing state in an effect.
 */
export function usePhotoSelection(photos: readonly ProductPhoto[]) {
  const indexes = useMemo(() => photos.map((photo) => photo.index), [photos]);
  const [selection, setSelection] = useState<Selection>(() => selectAll(indexes));

  // Stable callbacks let memoized photo tiles skip re-rendering on unrelated toggles.
  const toggle = useCallback((index: number) => {
    setSelection((current) => toggleOne(current, index));
  }, []);

  const toggleAllPhotos = useCallback(() => {
    setSelection((current) => toggleAll(current, indexes));
  }, [indexes]);

  const selectedPhotos = useMemo(
    () => photos.filter((photo) => selection.has(photo.index)),
    [photos, selection],
  );

  return {
    selection,
    selectedPhotos,
    selectAllState: getSelectAllState(selection, photos.length),
    toggle,
    toggleAll: toggleAllPhotos,
  };
}

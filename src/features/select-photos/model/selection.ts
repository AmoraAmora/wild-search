export type Selection = ReadonlySet<number>;

export type SelectAllState = 'all' | 'some' | 'none';

export function selectAll(indexes: readonly number[]): Selection {
  return new Set(indexes);
}

export function toggleOne(selection: Selection, index: number): Selection {
  const next = new Set(selection);

  if (!next.delete(index)) {
    next.add(index);
  }

  return next;
}

/** "Select all" clears everything when all are selected, otherwise selects all. */
export function toggleAll(selection: Selection, indexes: readonly number[]): Selection {
  return getSelectAllState(selection, indexes.length) === 'all' ? new Set() : selectAll(indexes);
}

export function getSelectAllState(selection: Selection, total: number): SelectAllState {
  if (selection.size === 0) {
    return 'none';
  }

  return selection.size === total ? 'all' : 'some';
}

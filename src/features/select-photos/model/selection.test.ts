import { describe, expect, it } from 'vitest';

import { getSelectAllState, selectAll, toggleAll, toggleOne } from './selection';

const INDEXES = [1, 2, 3];

describe('photo selection', () => {
  it('selects everything initially', () => {
    expect([...selectAll(INDEXES)]).toEqual([1, 2, 3]);
  });

  it('toggles a single photo without mutating the previous selection', () => {
    const initial = selectAll(INDEXES);
    const withoutSecond = toggleOne(initial, 2);

    expect([...withoutSecond]).toEqual([1, 3]);
    expect([...toggleOne(withoutSecond, 2)].toSorted()).toEqual([1, 2, 3]);
    expect([...initial]).toEqual([1, 2, 3]);
  });

  it.each([
    [[], 'none'],
    [[1], 'some'],
    [[1, 2, 3], 'all'],
  ] as const)('reports %j as "%s"', (selected, expected) => {
    expect(getSelectAllState(new Set(selected), INDEXES.length)).toBe(expected);
  });

  it('"select all" clears a full selection and fills a partial or empty one', () => {
    expect(toggleAll(selectAll(INDEXES), INDEXES).size).toBe(0);
    expect([...toggleAll(new Set([2]), INDEXES)]).toEqual([1, 2, 3]);
    expect([...toggleAll(new Set(), INDEXES)]).toEqual([1, 2, 3]);
  });
});

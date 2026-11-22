import { describe, expect, it } from 'vitest';

import { formatDuration } from './format-duration';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [11.432, '0:11'],
    [25.87, '0:26'],
    [59.6, '1:00'],
    [125, '2:05'],
  ])('formats %d seconds as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

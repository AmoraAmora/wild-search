import { describe, expect, it } from 'vitest';

import { HttpError, NetworkError } from './http';
import { isTransientError, shouldRetryRequest } from './retry-policy';

const URL_UNDER_TEST = 'https://example.test';

describe('isTransientError', () => {
  it.each([
    ['network failure', new NetworkError(URL_UNDER_TEST)],
    ['500', new HttpError(500, URL_UNDER_TEST)],
    ['503', new HttpError(503, URL_UNDER_TEST)],
    ['408 timeout', new HttpError(408, URL_UNDER_TEST)],
    ['429 rate limit', new HttpError(429, URL_UNDER_TEST)],
  ])('treats %s as transient', (_case, error) => {
    expect(isTransientError(error)).toBe(true);
  });

  it.each([
    ['404', new HttpError(404, URL_UNDER_TEST)],
    ['403', new HttpError(403, URL_UNDER_TEST)],
    ['a validation error', new Error('Invalid input')],
    ['a bug', new TypeError("Cannot read properties of undefined (reading 'x')")],
    ['an abort', new DOMException('Aborted', 'AbortError')],
  ])('treats %s as permanent', (_case, error) => {
    expect(isTransientError(error)).toBe(false);
  });
});

describe('shouldRetryRequest', () => {
  it('retries a transient error at most twice', () => {
    const error = new NetworkError(URL_UNDER_TEST);

    expect([0, 1, 2].map((failureCount) => shouldRetryRequest(failureCount, error))).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('never retries a permanent error', () => {
    expect(shouldRetryRequest(0, new HttpError(404, URL_UNDER_TEST))).toBe(false);
  });
});

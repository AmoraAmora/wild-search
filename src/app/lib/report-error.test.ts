import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpError, NetworkError } from '@/shared/api';
import { ExpectedError } from '@/shared/lib';

import { reportError } from './report-error';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('reportError', () => {
  it.each([
    ['an abort', new DOMException('Aborted', 'AbortError')],
    ['a network failure', new NetworkError('https://cdn.test')],
    ['an HTTP error', new HttpError(503, 'https://cdn.test')],
    ['an expected domain outcome (e.g. unknown article)', new ExpectedError('not found')],
  ])('stays silent for %s', (_case, error) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    reportError(error, 'test');

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('reports unexpected errors such as a changed WB response format', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const schemaError = new Error('Invalid input: expected number, received string');

    reportError(schemaError, 'query ["product",1,"media"]');

    expect(consoleError).toHaveBeenCalledWith('[query ["product",1,"media"]]', schemaError);
  });
});

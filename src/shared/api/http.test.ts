import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchBytes, fetchJson, fetchText, HttpError, isAbortError, isHttpError } from './http';

const URL_UNDER_TEST = 'https://example.test/resource';

function mockFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('http', () => {
  it('fetchJson parses the body', async () => {
    mockFetch(Response.json({ ok: true }));

    await expect(fetchJson(URL_UNDER_TEST)).resolves.toEqual({ ok: true });
  });

  it('fetchText returns the raw body', async () => {
    mockFetch(new Response('#EXTM3U'));

    await expect(fetchText(URL_UNDER_TEST)).resolves.toBe('#EXTM3U');
  });

  it('fetchBytes returns a Uint8Array', async () => {
    mockFetch(new Response(new Uint8Array([1, 2, 3])));

    await expect(fetchBytes(URL_UNDER_TEST)).resolves.toEqual(new Uint8Array([1, 2, 3]));
  });

  it('throws HttpError with status and url on a non-2xx response', async () => {
    mockFetch(new Response('Not found', { status: 404 }));

    const error: unknown = await fetchJson(URL_UNDER_TEST).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 404, url: URL_UNDER_TEST });
    expect(isHttpError(error)).toBe(true);
    expect(isHttpError(error, 404)).toBe(true);
    expect(isHttpError(error, 500)).toBe(false);
  });

  it('forwards the abort signal to fetch', async () => {
    const fetchMock = mockFetch(new Response('ok'));
    const controller = new AbortController();

    await fetchText(URL_UNDER_TEST, { signal: controller.signal });

    expect(fetchMock).toHaveBeenCalledWith(URL_UNDER_TEST, { signal: controller.signal });
  });

  it('isAbortError recognises abort errors only', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
    expect(isAbortError(new Error('Aborted'))).toBe(false);
    expect(isHttpError(new Error('x'))).toBe(false);
  });
});

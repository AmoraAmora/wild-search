export type RequestOptions = {
  signal?: AbortSignal;
};

export class HttpError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string) {
    super(`Request to ${url} failed with status ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
  }
}

export function isHttpError(error: unknown, status?: number): error is HttpError {
  return error instanceof HttpError && (status === undefined || error.status === status);
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

async function request(url: string, { signal }: RequestOptions = {}): Promise<Response> {
  const response = await fetch(url, signal ? { signal } : undefined);

  if (!response.ok) {
    throw new HttpError(response.status, url);
  }

  return response;
}

/**
 * Returns the parsed body as `unknown`: callers must validate it before use,
 * since third-party APIs give no guarantees about the response shape.
 */
export async function fetchJson(url: string, options?: RequestOptions): Promise<unknown> {
  const response = await request(url, options);
  return response.json();
}

export async function fetchText(url: string, options?: RequestOptions): Promise<string> {
  const response = await request(url, options);
  return response.text();
}

export async function fetchBytes(url: string, options?: RequestOptions): Promise<Uint8Array> {
  const response = await request(url, options);
  return new Uint8Array(await response.arrayBuffer());
}

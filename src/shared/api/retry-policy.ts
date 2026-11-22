import { HttpError, NetworkError } from './http';

const MAX_RETRIES = 2;

/** Statuses that may succeed on a later attempt; other 4xx won't change by retrying. */
const RETRYABLE_STATUSES = new Set([408, 429]);

export function isTransientError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof HttpError) {
    return error.status >= 500 || RETRYABLE_STATUSES.has(error.status);
  }

  // Validation errors, domain errors and bugs fail the same way every time.
  return false;
}

/** TanStack Query `retry` callback: retry only failures a second attempt can fix. */
export function shouldRetryRequest(failureCount: number, error: unknown): boolean {
  return failureCount < MAX_RETRIES && isTransientError(error);
}

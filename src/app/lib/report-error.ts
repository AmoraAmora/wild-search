import { HttpError, isAbortError, NetworkError } from '@/shared/api';
import { ExpectedError } from '@/shared/lib';

/**
 * Errors that are part of normal operation and already shown to the user:
 * cancellations, unreachable or failing WB servers, domain outcomes like an unknown article.
 */
function isExpectedError(error: unknown): boolean {
  return (
    isAbortError(error) ||
    error instanceof NetworkError ||
    error instanceof HttpError ||
    error instanceof ExpectedError
  );
}

/**
 * Single place for unexpected errors: bugs, render crashes, and — most importantly for
 * a client of non-public APIs — WB changing its response format (schema validation
 * errors). In production this is where an error tracker (e.g. Sentry) would be called.
 */
export function reportError(error: unknown, context: string): void {
  if (isExpectedError(error)) {
    return;
  }

  console.error(`[${context}]`, error);
}

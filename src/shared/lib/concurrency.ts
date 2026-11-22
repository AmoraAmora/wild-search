export type ProgressCallback = (completed: number, total: number) => void;

type MapWithConcurrencyOptions = {
  concurrency: number;
  signal?: AbortSignal;
  onProgress?: ProgressCallback;
};

/**
 * Maps `items` through an async `mapper`, running at most `concurrency` calls at once.
 *
 * - Results keep the order of `items`, regardless of completion order.
 * - Fails fast: the first rejection aborts the signal passed to in-flight mappers
 *   and stops scheduling the remaining items.
 * - An external `signal` cancels the whole run.
 */
export async function mapWithConcurrency<TItem, TResult>(
  items: readonly TItem[],
  mapper: (item: TItem, index: number, signal: AbortSignal) => Promise<TResult>,
  { concurrency, signal, onProgress }: MapWithConcurrencyOptions,
): Promise<TResult[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError(`concurrency must be a positive integer, got ${concurrency}`);
  }

  signal?.throwIfAborted();

  const controller = new AbortController();
  const runSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

  const results: TResult[] = [];
  // A single shared iterator: every worker pulls the next pending item from it.
  const queue = items.entries();
  let completed = 0;

  const worker = async () => {
    for (const [index, item] of queue) {
      runSignal.throwIfAborted();
      results[index] = await mapper(item, index, runSignal);
      completed += 1;
      onProgress?.(completed, items.length);
    }
  };

  const workerCount = Math.min(concurrency, items.length);

  try {
    await Promise.all(Array.from({ length: workerCount }, worker));
  } catch (error) {
    controller.abort(error);
    throw error;
  }

  return results;
}

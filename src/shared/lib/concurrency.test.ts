import { describe, expect, it, vi } from 'vitest';

import { mapWithConcurrency } from './concurrency';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('mapWithConcurrency', () => {
  it('keeps the input order regardless of completion order', async () => {
    const delays = [30, 10, 20, 0];

    const result = await mapWithConcurrency(
      delays,
      (delay, index) => new Promise<number>((resolve) => setTimeout(() => resolve(index), delay)),
      { concurrency: 2 },
    );

    expect(result).toEqual([0, 1, 2, 3]);
  });

  it('never runs more than `concurrency` mappers at once', async () => {
    let active = 0;
    let maxActive = 0;

    await mapWithConcurrency(
      Array.from({ length: 10 }, (_, index) => index),
      async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await tick();
        active -= 1;
      },
      { concurrency: 3 },
    );

    expect(maxActive).toBe(3);
  });

  it('reports progress after each completed item', async () => {
    const onProgress = vi.fn();

    await mapWithConcurrency(['a', 'b', 'c'], async (item) => item, {
      concurrency: 2,
      onProgress,
    });

    expect(onProgress.mock.calls).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it('returns an empty array for empty input', async () => {
    const mapper = vi.fn();

    await expect(mapWithConcurrency([], mapper, { concurrency: 2 })).resolves.toEqual([]);
    expect(mapper).not.toHaveBeenCalled();
  });

  it('fails fast: rejects with the first error, aborts in-flight work and stops scheduling', async () => {
    const error = new Error('boom');
    const first = deferred<void>();
    const signals: AbortSignal[] = [];
    const started: number[] = [];

    const run = mapWithConcurrency(
      [0, 1, 2, 3],
      async (item, _index, signal) => {
        started.push(item);
        signals.push(signal);
        if (item === 0) throw error;
        await first.promise;
      },
      { concurrency: 2 },
    );

    await expect(run).rejects.toBe(error);
    expect(signals[1]?.aborted).toBe(true);

    first.resolve();
    await tick();
    expect(started).toEqual([0, 1]);
  });

  it('rejects immediately when the external signal is already aborted', async () => {
    const mapper = vi.fn();

    await expect(
      mapWithConcurrency([1], mapper, { concurrency: 1, signal: AbortSignal.abort() }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(mapper).not.toHaveBeenCalled();
  });

  it('stops scheduling new items once the external signal is aborted', async () => {
    const controller = new AbortController();
    const started: number[] = [];

    const run = mapWithConcurrency(
      [0, 1, 2],
      async (item) => {
        started.push(item);
        controller.abort();
      },
      { concurrency: 1, signal: controller.signal },
    );

    await expect(run).rejects.toMatchObject({ name: 'AbortError' });
    expect(started).toEqual([0]);
  });

  it('rejects an invalid concurrency', async () => {
    await expect(mapWithConcurrency([1], async () => 1, { concurrency: 0 })).rejects.toThrow(
      RangeError,
    );
  });
});

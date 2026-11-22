// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { saveFile } from './save-file';
import {
  useFileDownload,
  type DownloadResult,
  type DownloadTaskContext,
} from './use-file-download';

vi.mock('./save-file', () => ({ saveFile: vi.fn() }));

const RESULT: DownloadResult = { blob: new Blob(['zip']), fileName: 'photos.zip' };

/** A task the test drives by hand: exposes its context and settles on demand. */
function controllableTask() {
  let context: DownloadTaskContext | undefined;
  let settle: { resolve: (value: DownloadResult) => void; reject: (reason: unknown) => void };
  const task = vi.fn(
    (_variables: string, ctx: DownloadTaskContext) =>
      new Promise<DownloadResult>((resolve, reject) => {
        context = ctx;
        settle = { resolve, reject };
      }),
  );

  return {
    task,
    context: () => {
      if (!context) throw new Error('Task has not started');
      return context;
    },
    resolve: (value: DownloadResult) => settle.resolve(value),
    reject: (reason: unknown) => settle.reject(reason),
  };
}

function renderDownloadHook(task: ReturnType<typeof controllableTask>['task']) {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useFileDownload(task), { wrapper });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useFileDownload', () => {
  it('reports progress as a whole percent and saves the file on success', async () => {
    const controlled = controllableTask();
    const { result } = renderDownloadHook(controlled.task);

    act(() => result.current.download('variables'));
    await waitFor(() => expect(controlled.task).toHaveBeenCalled());

    act(() => controlled.context().onProgress(0.416));
    expect(result.current).toMatchObject({ isPending: true, percent: 42 });

    await act(async () => controlled.resolve(RESULT));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(saveFile).toHaveBeenCalledWith(RESULT.blob, RESULT.fileName);
    expect(result.current.error).toBeNull();
  });

  it('aborts the running download on unmount and never saves its result', async () => {
    const controlled = controllableTask();
    const { result, unmount } = renderDownloadHook(controlled.task);

    act(() => result.current.download('variables'));
    await waitFor(() => expect(controlled.task).toHaveBeenCalled());
    const { signal } = controlled.context();

    unmount();
    await act(async () => controlled.resolve(RESULT));

    expect(signal.aborted).toBe(true);
    expect(saveFile).not.toHaveBeenCalled();
  });

  it('does not surface a user cancellation as an error', async () => {
    const controlled = controllableTask();
    const { result } = renderDownloadHook(controlled.task);

    act(() => result.current.download('variables'));
    await waitFor(() => expect(controlled.task).toHaveBeenCalled());

    act(() => result.current.cancel());
    await act(async () => controlled.reject(controlled.context().signal.reason));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.error).toBeNull();
    expect(saveFile).not.toHaveBeenCalled();
  });

  it('exposes a failure and clears it on reset', async () => {
    const controlled = controllableTask();
    const { result } = renderDownloadHook(controlled.task);
    const failure = new Error('CDN is down');

    act(() => result.current.download('variables'));
    await waitFor(() => expect(controlled.task).toHaveBeenCalled());
    await act(async () => controlled.reject(failure));

    await waitFor(() => expect(result.current.error).toBe(failure));

    act(() => result.current.resetError());
    await waitFor(() => expect(result.current.error).toBeNull());
  });
});

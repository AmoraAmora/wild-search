import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { isAbortError } from '../api';
import { saveFile } from './save-file';

export type DownloadResult = {
  blob: Blob;
  fileName: string;
};

export type DownloadTaskContext = {
  signal: AbortSignal;
  /** Overall progress, a fraction from 0 to 1. */
  onProgress: (fraction: number) => void;
};

export type DownloadTask<TVariables> = (
  variables: TVariables,
  context: DownloadTaskContext,
) => Promise<DownloadResult>;

/**
 * Runs a download task as a mutation and saves the resulting file.
 *
 * - Exposes progress as an integer percent, so frequent progress callbacks
 *   re-render only when the visible number changes.
 * - Starting a new download cancels the previous one; unmounting (e.g. closing
 *   the modal) cancels the running one. Cancellation is not reported as an error.
 */
export function useFileDownload<TVariables>(task: DownloadTask<TVariables>) {
  const [percent, setPercent] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const mutation = useMutation({
    mutationFn: async (variables: TVariables) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setPercent(0);

      try {
        const { blob, fileName } = await task(variables, {
          signal: controller.signal,
          onProgress: (fraction) => setPercent(Math.round(fraction * 100)),
        });
        controller.signal.throwIfAborted();
        saveFile(blob, fileName);
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
  });

  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  return {
    download: mutation.mutate,
    cancel,
    isPending: mutation.isPending,
    percent,
    error: isAbortError(mutation.error) ? null : mutation.error,
    resetError: mutation.reset,
  };
}

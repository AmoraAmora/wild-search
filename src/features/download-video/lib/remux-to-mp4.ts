import { UnsupportedVideoError } from '../model/errors';

type RemuxOptions = {
  signal: AbortSignal;
  onProgress: (fraction: number) => void;
};

/**
 * Repackages an MPEG-TS stream (H.264 + AAC) into a regular MP4 without re-encoding.
 *
 * mediabunny writes a standard, non-fragmented MP4 with the `moov` box up front
 * (`fastStart: 'in-memory'`), so the file plays and seeks everywhere — QuickTime
 * included. Remuxing a ~7 MB video takes well under 100 ms, so no Web Worker is needed.
 */
export async function remuxTsToMp4(ts: Uint8Array, { signal, onProgress }: RemuxOptions) {
  // Loaded on first use: keeps the media toolkit out of the initial bundle.
  const { BufferSource, BufferTarget, Conversion, Input, MPEG_TS, Mp4OutputFormat, Output } =
    await import('mediabunny');
  signal.throwIfAborted();

  const input = new Input({ formats: [MPEG_TS], source: new BufferSource(ts) });
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });

  try {
    const conversion = await Conversion.init({ input, output, showWarnings: false });

    if (!conversion.isValid) {
      const reasons = conversion.discardedTracks.map(
        ({ track, reason }) => `${track.type}: ${reason}`,
      );
      throw new UnsupportedVideoError(reasons.join(', ') || 'no tracks to convert');
    }

    conversion.onProgress = (progress) => onProgress(progress);
    const cancel = () => void conversion.cancel();
    signal.addEventListener('abort', cancel, { once: true });

    try {
      await conversion.execute();
    } finally {
      signal.removeEventListener('abort', cancel);
    }
  } finally {
    input.dispose();
  }

  signal.throwIfAborted();

  if (!target.buffer) {
    throw new UnsupportedVideoError('remux produced no output');
  }

  return new Blob([target.buffer], { type: 'video/mp4' });
}

const RELOADED_AT_KEY = 'stale-chunk-reload-at';

/** A second failure within this window means the chunk is really unavailable, not stale. */
const RELOAD_COOLDOWN_MS = 10_000;

function readReloadedAt(): number {
  try {
    return Number(sessionStorage.getItem(RELOADED_AT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeReloadedAt(timestamp: number): void {
  try {
    sessionStorage.setItem(RELOADED_AT_KEY, String(timestamp));
  } catch {
    // Storage unavailable (private mode, blocked cookies): the reload still happens once.
  }
}

/**
 * After a new deploy, a tab opened earlier still references the old hashed chunks,
 * which no longer exist, so lazy imports (modal, zip, video remux) fail.
 * Vite reports this via `vite:preloadError`; reloading picks up the new build.
 * The cooldown prevents a reload loop when the network itself is down — then the
 * error propagates to the error boundary instead.
 */
export function reloadOnStaleChunk(): void {
  window.addEventListener('vite:preloadError', (event) => {
    const now = Date.now();

    if (now - readReloadedAt() < RELOAD_COOLDOWN_MS) {
      return;
    }

    event.preventDefault();
    writeReloadedAt(now);
    window.location.reload();
  });
}

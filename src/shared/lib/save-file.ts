/**
 * Delay before revoking the object URL. Revoking synchronously after `click()`
 * cancels the download in some browsers (notably Safari), so the URL is kept
 * alive for a while — the same approach FileSaver.js uses.
 */
const REVOKE_DELAY_MS = 40_000;

export function saveFile(data: Blob, fileName: string): void {
  const url = URL.createObjectURL(data);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';

  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

/**
 * Max parallel requests to the WB CDN when downloading media.
 * Keeps the CDN from rate-limiting a burst of requests and makes progress
 * reporting smooth; also matches the browser's per-host limit on HTTP/1.1.
 */
export const MEDIA_DOWNLOAD_CONCURRENCY = 6;

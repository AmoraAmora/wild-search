/** The video exists but is in a form this app can't turn into an MP4. */
export class UnsupportedVideoError extends Error {
  constructor(reason: string) {
    super(`Unsupported video: ${reason}`);
    this.name = 'UnsupportedVideoError';
  }
}

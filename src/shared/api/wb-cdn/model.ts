/** A CDN host serving the inclusive range of volumes `[from, to]`. */
export type HostRange = {
  from: number;
  to: number;
  host: string;
};

export type CdnRoutes = {
  /** Hosts for product card info and photos ("basket-XX"). */
  media: readonly HostRange[];
  /** Hosts for product videos ("videonme-basket-XX"). */
  video: readonly HostRange[];
};

export const ImageSize = {
  /** Tiny thumbnail. */
  Small: 'tm',
  /** 246×328 preview, good for grids. */
  Medium: 'c246x328',
  /** 516×688 preview. */
  Large: 'c516x688',
  /** Full-size photo as shown on the product page. */
  Big: 'big',
  /** Original-quality photo; not available for every photo. */
  Hq: 'hq',
} as const;

export type ImageSize = (typeof ImageSize)[keyof typeof ImageSize];

/** Video renditions the CDN may serve, best first. The set differs between products. */
export const VIDEO_QUALITIES = ['1440p', '1080p', '720p'] as const;

export type VideoQuality = (typeof VIDEO_QUALITIES)[number];

export class CdnHostNotFoundError extends Error {
  readonly vol: number;

  constructor(vol: number) {
    super(`No CDN host serves volume ${vol}`);
    this.name = 'CdnHostNotFoundError';
    this.vol = vol;
  }
}

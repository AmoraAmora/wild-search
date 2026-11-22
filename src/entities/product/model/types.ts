export type ProductPhoto = {
  /** 1-based photo number, as WB numbers them. */
  index: number;
  /** Small image for the selection grid. */
  previewUrl: string;
  /** Best available quality: `hq` when WB has it for this photo, otherwise `big`. */
  downloadUrl: string;
};

export type ProductMedia = {
  nmId: number;
  name: string;
  brand: string | null;
  photos: ProductPhoto[];
  /** Base URL for the product's HLS renditions; `null` when the product has no video. */
  videoBaseUrl: string | null;
};

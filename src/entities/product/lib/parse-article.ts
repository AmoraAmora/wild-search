/** WB article (nm id) is a positive integer; 15 digits is far above any real id. */
const ARTICLE_PATTERN = /^\d{1,15}$/;

/** Matches product links like `https://www.wildberries.ru/catalog/604174866/detail.aspx`. */
const PRODUCT_URL_PATTERN = /\/catalog\/(\d{1,15})(?:\/|$)/;

/**
 * Extracts a WB article from user input: either the bare number
 * or a link to the product page. Returns `null` for anything else.
 */
export function parseArticle(input: string): number | null {
  const value = input.trim();
  const digits = ARTICLE_PATTERN.test(value) ? value : PRODUCT_URL_PATTERN.exec(value)?.[1];

  if (digits === undefined) {
    return null;
  }

  const nmId = Number(digits);

  return Number.isSafeInteger(nmId) && nmId > 0 ? nmId : null;
}

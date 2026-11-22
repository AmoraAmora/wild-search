export class ProductNotFoundError extends Error {
  readonly nmId: number;

  constructor(nmId: number, options?: ErrorOptions) {
    super(`Product ${nmId} not found`, options);
    this.name = 'ProductNotFoundError';
    this.nmId = nmId;
  }
}

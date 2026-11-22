import { ExpectedError } from '@/shared/lib';

export class ProductNotFoundError extends ExpectedError {
  readonly nmId: number;

  constructor(nmId: number, options?: ErrorOptions) {
    super(`Product ${nmId} not found`, options);
    this.name = 'ProductNotFoundError';
    this.nmId = nmId;
  }
}

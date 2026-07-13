import { rowOrderContract } from './row-order-contract';
import type { RowOrder } from './row-order-contract';

export const RowOrderStub = ({ value }: { value?: number } = {}): RowOrder =>
  rowOrderContract.parse(value ?? 1);

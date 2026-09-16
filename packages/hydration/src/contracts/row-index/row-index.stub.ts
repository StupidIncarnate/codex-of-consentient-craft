import { rowIndexContract } from './row-index-contract';
import type { RowIndex } from './row-index-contract';

export const RowIndexStub = ({ value }: { value: number } = { value: 0 }): RowIndex =>
  rowIndexContract.parse(value);

import { rowRefContract } from './row-ref-contract';
import type { RowRef } from './row-ref-contract';

export const RowRefStub = ({ value }: { value: string } = { value: 'guild[0:0]' }): RowRef =>
  rowRefContract.parse(value);

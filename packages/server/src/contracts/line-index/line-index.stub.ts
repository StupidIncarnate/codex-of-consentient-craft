import { lineIndexContract } from './line-index-contract';
import type { LineIndex } from './line-index-contract';

export const LineIndexStub = (
  {
    value,
  }: {
    value: number;
  } = {
    value: 0,
  },
): LineIndex => lineIndexContract.parse(value);

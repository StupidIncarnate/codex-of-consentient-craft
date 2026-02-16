import { resultCountContract } from './result-count-contract';
import type { ResultCount } from './result-count-contract';

export const ResultCountStub = (
  {
    value,
  }: {
    value: number;
  } = {
    value: 0,
  },
): ResultCount => resultCountContract.parse(value);

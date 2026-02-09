import { totalCountContract } from './total-count-contract';
import type { TotalCount } from './total-count-contract';

export const TotalCountStub = ({ value }: { value: number } = { value: 5 }): TotalCount =>
  totalCountContract.parse(value);

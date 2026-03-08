import { totalCountContract } from './total-count-contract';
import type { TotalCount } from './total-count-contract';

export const TotalCountStub = ({ value }: { value?: number } = {}): TotalCount =>
  totalCountContract.parse(value ?? 8);

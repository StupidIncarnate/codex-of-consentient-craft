import { takeCountContract } from './take-count-contract';
import type { TakeCount } from './take-count-contract';

export const TakeCountStub = ({ value = 1 }: { value?: number } = {}): TakeCount =>
  takeCountContract.parse(value);

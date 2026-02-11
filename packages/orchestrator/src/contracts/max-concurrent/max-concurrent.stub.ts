import { maxConcurrentContract } from './max-concurrent-contract';
import type { MaxConcurrent } from './max-concurrent-contract';

export const MaxConcurrentStub = ({ value }: { value: number } = { value: 3 }): MaxConcurrent =>
  maxConcurrentContract.parse(value);

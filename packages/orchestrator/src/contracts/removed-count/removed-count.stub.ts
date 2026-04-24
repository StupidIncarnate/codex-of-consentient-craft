import { removedCountContract } from './removed-count-contract';
import type { RemovedCount } from './removed-count-contract';

export const RemovedCountStub = ({ value }: { value?: number } = {}): RemovedCount =>
  removedCountContract.parse(value ?? 0);

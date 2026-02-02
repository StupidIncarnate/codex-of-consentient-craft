import { completedCountContract } from './completed-count-contract';
import type { CompletedCount } from './completed-count-contract';

export const CompletedCountStub = ({ value }: { value: number } = { value: 0 }): CompletedCount =>
  completedCountContract.parse(value);

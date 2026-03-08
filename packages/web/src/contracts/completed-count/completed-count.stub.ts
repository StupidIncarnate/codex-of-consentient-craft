import { completedCountContract } from './completed-count-contract';
import type { CompletedCount } from './completed-count-contract';

export const CompletedCountStub = ({ value }: { value?: number } = {}): CompletedCount =>
  completedCountContract.parse(value ?? 3);

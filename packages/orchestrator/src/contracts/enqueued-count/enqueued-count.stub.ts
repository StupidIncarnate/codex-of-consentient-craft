import { enqueuedCountContract } from './enqueued-count-contract';
import type { EnqueuedCount } from './enqueued-count-contract';

export const EnqueuedCountStub = ({ value }: { value?: number } = {}): EnqueuedCount =>
  enqueuedCountContract.parse(value ?? 0);

import { idleReasonContract } from './idle-reason-contract';
import type { IdleReason } from './idle-reason-contract';

export const IdleReasonStub = (
  { value }: { value: string } = { value: 'the Node dispatcher owns the queue' },
): IdleReason => idleReasonContract.parse(value);

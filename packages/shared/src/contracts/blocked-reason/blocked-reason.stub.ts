import { blockedReasonContract } from './blocked-reason-contract';
import type { BlockedReason } from './blocked-reason-contract';

export const BlockedReasonStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'git add is permission-denied in this dispatched session',
  },
): BlockedReason => blockedReasonContract.parse(value);

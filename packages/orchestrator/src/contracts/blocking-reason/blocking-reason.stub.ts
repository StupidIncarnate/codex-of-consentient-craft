import type { StubArgument } from '@dungeonmaster/shared/@types';

import { blockingReasonContract } from './blocking-reason-contract';
import type { BlockingReason } from './blocking-reason-contract';

export const BlockingReasonStub = ({
  value = 'User input needed',
}: StubArgument<{ value: string }> = {}): BlockingReason => blockingReasonContract.parse(value);

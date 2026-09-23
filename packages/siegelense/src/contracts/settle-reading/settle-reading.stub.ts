import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ReadingCountStub } from '../reading-count/reading-count.stub';
import { settleReadingContract } from './settle-reading-contract';
import type { SettleReading } from './settle-reading-contract';

export const SettleReadingStub = ({ ...props }: StubArgument<SettleReading> = {}): SettleReading =>
  settleReadingContract.parse({
    settled: true,
    reason: 'quiet',
    waitedMs: 0,
    unsettled: [],
    pendingRequests: ReadingCountStub({ value: 0 }),
    pollersDiscounted: [],
    ...props,
  });

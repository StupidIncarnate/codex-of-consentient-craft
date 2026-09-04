import { timeBucketContract, type TimeBucket } from './time-bucket-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TimeBucketStub = ({ ...props }: StubArgument<TimeBucket> = {}): TimeBucket =>
  timeBucketContract.parse({
    windowStart: '2025-01-15T10:00:00.000Z',
    windowEnd: '2025-01-15T10:05:00.000Z',
    apiResponseCount: 12,
    toolCallCount: 8,
    outputTokens: 4_500,
    contextInTokens: 120_000,
    toolResultBytes: 34_000,
    topTools: [{ name: 'Read', count: 5 }],
    ...props,
  });

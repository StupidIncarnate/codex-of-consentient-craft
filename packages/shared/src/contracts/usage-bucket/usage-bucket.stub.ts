import type { StubArgument } from '@dungeonmaster/shared/@types';

import { usageBucketContract } from './usage-bucket-contract';
import type { UsageBucket } from './usage-bucket-contract';

export const UsageBucketStub = ({ ...props }: StubArgument<UsageBucket> = {}): UsageBucket =>
  usageBucketContract.parse({
    input: 120,
    cacheCreation: 4_000,
    cacheRead: 90_000,
    output: 300,
    ...props,
  });

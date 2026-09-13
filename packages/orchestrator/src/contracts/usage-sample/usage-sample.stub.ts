import type { StubArgument } from '@dungeonmaster/shared/@types';
import { UsageBucketStub } from '@dungeonmaster/shared/contracts';

import { usageSampleContract } from './usage-sample-contract';
import type { UsageSample } from './usage-sample-contract';

export const UsageSampleStub = ({ ...props }: StubArgument<UsageSample> = {}): UsageSample =>
  usageSampleContract.parse({
    bucketStartMs: 1_789_272_000_000,
    tokens: UsageBucketStub(),
    ...props,
  });

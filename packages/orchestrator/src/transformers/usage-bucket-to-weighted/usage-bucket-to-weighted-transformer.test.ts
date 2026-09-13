import { UsageBucketStub } from '@dungeonmaster/shared/contracts';

import { usageBucketToWeightedTransformer } from './usage-bucket-to-weighted-transformer';

describe('usageBucketToWeightedTransformer', () => {
  it('VALID: {100 of each kind} => applies 1x, 1.25x, 0.1x and 5x', () => {
    const result = usageBucketToWeightedTransformer({
      bucket: UsageBucketStub({
        input: 100,
        cacheCreation: 100,
        cacheRead: 100,
        output: 100,
      }),
    });

    expect(result).toBe(735);
  });

  it('VALID: {output only} => weights it five times', () => {
    const result = usageBucketToWeightedTransformer({
      bucket: UsageBucketStub({ input: 0, cacheCreation: 0, cacheRead: 0, output: 10 }),
    });

    expect(result).toBe(50);
  });

  it('VALID: {cache reads only} => weights them a tenth, which is what stops them swamping the total', () => {
    const result = usageBucketToWeightedTransformer({
      bucket: UsageBucketStub({ input: 0, cacheCreation: 0, cacheRead: 1_000, output: 0 }),
    });

    expect(result).toBe(100);
  });

  it('EMPTY: {all zero} => returns 0', () => {
    const result = usageBucketToWeightedTransformer({
      bucket: UsageBucketStub({ input: 0, cacheCreation: 0, cacheRead: 0, output: 0 }),
    });

    expect(result).toBe(0);
  });
});

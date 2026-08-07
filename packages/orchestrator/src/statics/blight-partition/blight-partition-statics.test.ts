import { blightPartitionStatics } from './blight-partition-statics';

describe('blightPartitionStatics', () => {
  it('VALID: exported value => pins the per-group file target and the parallel-wave ceiling', () => {
    expect(blightPartitionStatics).toStrictEqual({
      targetFilesPerGroup: 6,
      maxConcurrentMinions: 8,
    });
  });
});

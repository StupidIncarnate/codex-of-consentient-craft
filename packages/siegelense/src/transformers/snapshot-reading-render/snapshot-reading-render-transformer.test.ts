import { SnapshotNameStub } from '../../contracts/snapshot-name/snapshot-name.stub';
import { snapshotReadingRenderTransformer } from './snapshot-reading-render-transformer';

describe('snapshotReadingRenderTransformer', () => {
  it('VALID: {name: "clean"} => formats to "snapshot \\"clean\\" recorded"', () => {
    const result = snapshotReadingRenderTransformer({
      name: SnapshotNameStub({ value: 'clean' }),
    });

    expect(result).toBe('snapshot "clean" recorded');
  });

  it('VALID: {name: "after-cycle-1"} => formats to "snapshot \\"after-cycle-1\\" recorded"', () => {
    const result = snapshotReadingRenderTransformer({
      name: SnapshotNameStub({ value: 'after-cycle-1' }),
    });

    expect(result).toBe('snapshot "after-cycle-1" recorded');
  });
});

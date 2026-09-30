import { snapshotReadingRenderTransformer } from './snapshot-reading-render-transformer';

describe('snapshotReadingRenderTransformer', () => {
  it('VALID: {name: "clean"} => formats to "snapshot \\"clean\\" recorded"', () => {
    const result = snapshotReadingRenderTransformer({
      name: 'clean',
    });

    expect(result).toBe('snapshot "clean" recorded');
  });

  it('VALID: {name: "after-cycle-1"} => formats to "snapshot \\"after-cycle-1\\" recorded"', () => {
    const result = snapshotReadingRenderTransformer({
      name: 'after-cycle-1',
    });

    expect(result).toBe('snapshot "after-cycle-1" recorded');
  });
});

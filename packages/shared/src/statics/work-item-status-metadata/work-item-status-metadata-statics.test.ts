import { workItemStatusMetadataStatics } from './work-item-status-metadata-statics';

describe('workItemStatusMetadataStatics', () => {
  describe('coverage', () => {
    it('VALID: statuses => covers all 5 work-item statuses', () => {
      const statusKeys = Object.keys(workItemStatusMetadataStatics.statuses).sort();

      expect(statusKeys).toStrictEqual(
        ['complete', 'failed', 'in_progress', 'pending', 'skipped'].sort(),
      );
    });
  });

  describe('row values', () => {
    it('VALID: pending => matches expected metadata', () => {
      expect(workItemStatusMetadataStatics.statuses.pending).toStrictEqual({
        isTerminal: false,
        satisfiesDependency: false,
        isActive: false,
        isPending: true,
        isComplete: false,
        isSkipped: false,
        isFailure: false,
      });
    });

    it('VALID: in_progress => matches expected metadata', () => {
      expect(workItemStatusMetadataStatics.statuses.in_progress).toStrictEqual({
        isTerminal: false,
        satisfiesDependency: false,
        isActive: true,
        isPending: false,
        isComplete: false,
        isSkipped: false,
        isFailure: false,
      });
    });

    it('VALID: complete => matches expected metadata', () => {
      expect(workItemStatusMetadataStatics.statuses.complete).toStrictEqual({
        isTerminal: true,
        satisfiesDependency: true,
        isActive: false,
        isPending: false,
        isComplete: true,
        isSkipped: false,
        isFailure: false,
      });
    });

    it('VALID: failed => matches expected metadata', () => {
      expect(workItemStatusMetadataStatics.statuses.failed).toStrictEqual({
        isTerminal: true,
        satisfiesDependency: true,
        isActive: false,
        isPending: false,
        isComplete: false,
        isSkipped: false,
        isFailure: true,
      });
    });

    it('VALID: skipped => matches expected metadata', () => {
      expect(workItemStatusMetadataStatics.statuses.skipped).toStrictEqual({
        isTerminal: true,
        satisfiesDependency: false,
        isActive: false,
        isPending: false,
        isComplete: false,
        isSkipped: true,
        isFailure: false,
      });
    });
  });
});

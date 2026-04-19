import { isSkippedWorkItemStatusGuard } from './is-skipped-work-item-status-guard';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

const STATUSES = Object.keys(
  workItemStatusMetadataStatics.statuses,
) as readonly (keyof typeof workItemStatusMetadataStatics.statuses)[];

const SKIPPED_STATUSES: ReadonlySet<keyof typeof workItemStatusMetadataStatics.statuses> = new Set([
  'skipped',
]);

describe('isSkippedWorkItemStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = SKIPPED_STATUSES.has(status);

      const result = isSkippedWorkItemStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isSkippedWorkItemStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

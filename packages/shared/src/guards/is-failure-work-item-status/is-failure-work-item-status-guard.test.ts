import { isFailureWorkItemStatusGuard } from './is-failure-work-item-status-guard';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

const STATUSES = Object.keys(
  workItemStatusMetadataStatics.statuses,
) as readonly (keyof typeof workItemStatusMetadataStatics.statuses)[];

const FAILURE_STATUSES: ReadonlySet<keyof typeof workItemStatusMetadataStatics.statuses> = new Set([
  'failed',
]);

describe('isFailureWorkItemStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = FAILURE_STATUSES.has(status);

      const result = isFailureWorkItemStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isFailureWorkItemStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

import { isPendingWorkItemStatusGuard } from './is-pending-work-item-status-guard';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

const STATUSES = Object.keys(
  workItemStatusMetadataStatics.statuses,
) as readonly (keyof typeof workItemStatusMetadataStatics.statuses)[];

const PENDING_STATUSES: ReadonlySet<keyof typeof workItemStatusMetadataStatics.statuses> = new Set([
  'pending',
]);

describe('isPendingWorkItemStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = PENDING_STATUSES.has(status);

      const result = isPendingWorkItemStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isPendingWorkItemStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

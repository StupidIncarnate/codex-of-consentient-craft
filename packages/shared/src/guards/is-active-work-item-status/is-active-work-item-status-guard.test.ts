import { isActiveWorkItemStatusGuard } from './is-active-work-item-status-guard';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

const STATUSES = Object.keys(
  workItemStatusMetadataStatics.statuses,
) as readonly (keyof typeof workItemStatusMetadataStatics.statuses)[];

const ACTIVE_STATUSES: ReadonlySet<keyof typeof workItemStatusMetadataStatics.statuses> = new Set([
  'in_progress',
]);

describe('isActiveWorkItemStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = ACTIVE_STATUSES.has(status);

      const result = isActiveWorkItemStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isActiveWorkItemStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

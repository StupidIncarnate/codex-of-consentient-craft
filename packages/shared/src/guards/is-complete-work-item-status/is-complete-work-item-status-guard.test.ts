import { isCompleteWorkItemStatusGuard } from './is-complete-work-item-status-guard';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

const STATUSES = Object.keys(
  workItemStatusMetadataStatics.statuses,
) as readonly (keyof typeof workItemStatusMetadataStatics.statuses)[];

const COMPLETE_STATUSES: ReadonlySet<keyof typeof workItemStatusMetadataStatics.statuses> = new Set(
  ['complete'],
);

describe('isCompleteWorkItemStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = COMPLETE_STATUSES.has(status);

      const result = isCompleteWorkItemStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isCompleteWorkItemStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

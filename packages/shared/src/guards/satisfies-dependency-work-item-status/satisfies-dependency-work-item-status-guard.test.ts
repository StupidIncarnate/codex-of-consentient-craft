import { satisfiesDependencyWorkItemStatusGuard } from './satisfies-dependency-work-item-status-guard';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

const STATUSES = Object.keys(
  workItemStatusMetadataStatics.statuses,
) as readonly (keyof typeof workItemStatusMetadataStatics.statuses)[];

const SATISFIES_DEPENDENCY_STATUSES: ReadonlySet<
  keyof typeof workItemStatusMetadataStatics.statuses
> = new Set(['complete', 'failed']);

describe('satisfiesDependencyWorkItemStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = SATISFIES_DEPENDENCY_STATUSES.has(status);

      const result = satisfiesDependencyWorkItemStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = satisfiesDependencyWorkItemStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

import { isPreExecutionQuestStatusGuard } from './is-pre-execution-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const PRE_EXECUTION_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set([
    'created',
    'pending',
    'explore_flows',
    'review_flows',
    'flows_approved',
    'explore_observables',
    'review_observables',
    'approved',
    'explore_design',
    'review_design',
    'design_approved',
  ]);

describe('isPreExecutionQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = PRE_EXECUTION_STATUSES.has(status);

      const result = isPreExecutionQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isPreExecutionQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

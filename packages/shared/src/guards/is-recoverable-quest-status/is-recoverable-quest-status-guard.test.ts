import { isRecoverableQuestStatusGuard } from './is-recoverable-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const RECOVERABLE_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> = new Set(
  [
    'created',
    'pending',
    'explore_flows',
    'flows_approved',
    'explore_observables',
    'explore_design',
    'seek_scope',
    'seek_synth',
    'seek_walk',
    'seek_plan',
    'in_progress',
  ],
);

describe('isRecoverableQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = RECOVERABLE_STATUSES.has(status);

      const result = isRecoverableQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

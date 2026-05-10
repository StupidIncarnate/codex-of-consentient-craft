import { isPathseekerRunningQuestStatusGuard } from './is-pathseeker-running-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const PATHSEEKER_RUNNING_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set(['seek_scope', 'seek_synth', 'seek_walk']);

describe('isPathseekerRunningQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = PATHSEEKER_RUNNING_STATUSES.has(status);

      const result = isPathseekerRunningQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isPathseekerRunningQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

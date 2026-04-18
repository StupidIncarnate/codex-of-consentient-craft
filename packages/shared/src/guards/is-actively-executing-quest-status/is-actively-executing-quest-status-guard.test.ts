import { isActivelyExecutingQuestStatusGuard } from './is-actively-executing-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const ACTIVELY_EXECUTING_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set(['in_progress']);

describe('isActivelyExecutingQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = ACTIVELY_EXECUTING_STATUSES.has(status);

      const result = isActivelyExecutingQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isActivelyExecutingQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

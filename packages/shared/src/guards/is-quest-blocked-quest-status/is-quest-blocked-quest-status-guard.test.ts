import { isQuestBlockedQuestStatusGuard } from './is-quest-blocked-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const QUEST_BLOCKED_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set(['blocked']);

describe('isQuestBlockedQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = QUEST_BLOCKED_STATUSES.has(status);

      const result = isQuestBlockedQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isQuestBlockedQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

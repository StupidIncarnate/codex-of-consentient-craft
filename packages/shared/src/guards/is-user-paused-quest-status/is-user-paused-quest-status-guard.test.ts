import { isUserPausedQuestStatusGuard } from './is-user-paused-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const USER_PAUSED_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> = new Set(
  ['paused'],
);

describe('isUserPausedQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = USER_PAUSED_STATUSES.has(status);

      const result = isUserPausedQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isUserPausedQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

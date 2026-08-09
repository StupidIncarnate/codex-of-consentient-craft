import { isFollowupChatableQuestStatusGuard } from './is-followup-chatable-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

// Both the case list and the expected subset come from the same static the guard reads, so a
// status added to `statuses` joins this matrix automatically rather than being silently skipped.
const FOLLOWUP_CHATABLE_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set(
    STATUSES.filter((status) => questStatusMetadataStatics.statuses[status].isFollowupChatable),
  );

describe('isFollowupChatableQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = FOLLOWUP_CHATABLE_STATUSES.has(status);

      const result = isFollowupChatableQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isFollowupChatableQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

import { shouldShowBeginQuestModalQuestStatusGuard } from './should-show-begin-quest-modal-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const BEGIN_QUEST_MODAL_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set(['approved']);

describe('shouldShowBeginQuestModalQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = BEGIN_QUEST_MODAL_STATUSES.has(status);

      const result = shouldShowBeginQuestModalQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = shouldShowBeginQuestModalQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

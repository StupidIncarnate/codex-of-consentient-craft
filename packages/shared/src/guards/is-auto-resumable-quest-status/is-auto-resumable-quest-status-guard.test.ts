import { isAutoResumableQuestStatusGuard } from './is-auto-resumable-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const AUTO_RESUMABLE_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set(['in_progress']);

describe('isAutoResumableQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = AUTO_RESUMABLE_STATUSES.has(status);

      const result = isAutoResumableQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isAutoResumableQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

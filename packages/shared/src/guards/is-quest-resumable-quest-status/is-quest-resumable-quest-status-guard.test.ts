import { isQuestResumableQuestStatusGuard } from './is-quest-resumable-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const RESUMABLE_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> = new Set([
  'paused',
  'blocked',
]);

describe('isQuestResumableQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = RESUMABLE_STATUSES.has(status);

      const result = isQuestResumableQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isQuestResumableQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

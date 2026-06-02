import { isAbandonedQuestStatusGuard } from './is-abandoned-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const ABANDONED_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> = new Set([
  'abandoned',
]);

describe('isAbandonedQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = ABANDONED_STATUSES.has(status);

      const result = isAbandonedQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('complete is NOT abandoned (re-openable terminal)', () => {
    it('VALID: {status: complete} => false', () => {
      const result = isAbandonedQuestStatusGuard({ status: 'complete' });

      expect(result).toBe(false);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isAbandonedQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

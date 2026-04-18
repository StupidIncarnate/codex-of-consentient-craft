import { isStartableQuestStatusGuard } from './is-startable-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const STARTABLE_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> = new Set([
  'approved',
  'design_approved',
]);

describe('isStartableQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = STARTABLE_STATUSES.has(status);

      const result = isStartableQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isStartableQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

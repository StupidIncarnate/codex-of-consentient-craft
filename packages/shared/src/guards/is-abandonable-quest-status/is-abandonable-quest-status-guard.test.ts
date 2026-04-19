import { isAbandonableQuestStatusGuard } from './is-abandonable-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const TERMINAL_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> = new Set([
  'complete',
  'abandoned',
]);

describe('isAbandonableQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = !TERMINAL_STATUSES.has(status);

      const result = isAbandonableQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isAbandonableQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

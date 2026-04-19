import { isTerminalQuestStatusGuard } from './is-terminal-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const TERMINAL_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> = new Set([
  'complete',
  'abandoned',
]);

describe('isTerminalQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = TERMINAL_STATUSES.has(status);

      const result = isTerminalQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isTerminalQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

import { isTerminalWorkItemStatusGuard } from './is-terminal-work-item-status-guard';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';

const STATUSES = Object.keys(
  workItemStatusMetadataStatics.statuses,
) as readonly (keyof typeof workItemStatusMetadataStatics.statuses)[];

const TERMINAL_STATUSES: ReadonlySet<keyof typeof workItemStatusMetadataStatics.statuses> = new Set(
  ['complete', 'failed', 'skipped'],
);

describe('isTerminalWorkItemStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = TERMINAL_STATUSES.has(status);

      const result = isTerminalWorkItemStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isTerminalWorkItemStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

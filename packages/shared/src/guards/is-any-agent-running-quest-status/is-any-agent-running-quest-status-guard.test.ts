import { isAnyAgentRunningQuestStatusGuard } from './is-any-agent-running-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const ANY_AGENT_RUNNING_STATUSES: ReadonlySet<keyof typeof questStatusMetadataStatics.statuses> =
  new Set(['seek_scope', 'seek_synth', 'seek_walk', 'seek_plan', 'in_progress']);

describe('isAnyAgentRunningQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = ANY_AGENT_RUNNING_STATUSES.has(status);

      const result = isAnyAgentRunningQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isAnyAgentRunningQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});

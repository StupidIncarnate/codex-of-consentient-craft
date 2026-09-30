
import { locationsCitationQuestPlansPathFindBroker } from './locations-citation-quest-plans-path-find-broker';
import { locationsCitationQuestPlansPathFindBrokerProxy } from './locations-citation-quest-plans-path-find-broker.proxy';

describe('locationsCitationQuestPlansPathFindBroker', () => {
  describe('quest plans resolution', () => {
    it('VALID: {worktreePath} => <worktreePath>/.quest-plans', () => {
      locationsCitationQuestPlansPathFindBrokerProxy();

      const result = locationsCitationQuestPlansPathFindBroker({
        worktreePath: '/repo/worktrees/add-auth-7bc217a1',
      });

      expect(result).toBe(
        '/repo/worktrees/add-auth-7bc217a1/.quest-plans',
      );
    });

    it('EDGE: {a worktreePath with a trailing separator} => joined without a double slash', () => {
      locationsCitationQuestPlansPathFindBrokerProxy();

      const result = locationsCitationQuestPlansPathFindBroker({
        worktreePath: '/repo/worktrees/add-auth-7bc217a1/',
      });

      expect(result).toBe(
        '/repo/worktrees/add-auth-7bc217a1/.quest-plans',
      );
    });
  });
});

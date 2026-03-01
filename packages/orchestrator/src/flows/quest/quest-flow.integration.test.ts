import { QuestFlow } from './quest-flow';

describe('QuestFlow', () => {
  describe('delegation to responders', () => {
    it('VALID: {questId: nonexistent} => get delegates to QuestGetResponder and returns error', async () => {
      const result = await QuestFlow.get({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });

    it('VALID: {questId: nonexistent} => verify delegates to QuestVerifyResponder and returns error', async () => {
      const result = await QuestFlow.verify({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });
  });
});

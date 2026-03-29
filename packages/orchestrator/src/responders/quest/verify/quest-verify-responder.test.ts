import { QuestStub } from '@dungeonmaster/shared/contracts';

import { QuestVerifyResponderProxy } from './quest-verify-responder.proxy';

describe('QuestVerifyResponder', () => {
  describe('successful verification', () => {
    it('VALID: {questId} => returns verify result via broker', async () => {
      const quest = QuestStub();
      const proxy = QuestVerifyResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      const { success, checks } = result;

      expect(success).toBe(true);
      expect(checks).toStrictEqual(expect.any(Array));
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId: nonexistent} => returns error result', async () => {
      const proxy = QuestVerifyResponderProxy();
      proxy.setupEmptyFolder();

      const result = await proxy.callResponder({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });
  });
});

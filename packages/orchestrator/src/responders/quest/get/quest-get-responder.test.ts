import { QuestStub } from '@dungeonmaster/shared/contracts';

import { QuestGetResponderProxy } from './quest-get-responder.proxy';

describe('QuestGetResponder', () => {
  describe('successful retrieval', () => {
    it('VALID: {questId} => returns quest data via broker', async () => {
      const quest = QuestStub();
      const proxy = QuestGetResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result.success).toBe(true);
      expect(result.quest?.id).toBe(quest.id);
    });

    it('VALID: {questId, stage} => passes stage to broker for filtering', async () => {
      const quest = QuestStub();
      const proxy = QuestGetResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id, stage: 'spec' });

      expect(result.success).toBe(true);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId: nonexistent} => returns error result', async () => {
      const proxy = QuestGetResponderProxy();
      proxy.setupEmptyFolder();

      const result = await proxy.callResponder({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });
  });
});

import {
  QuestIdStub,
  QuestStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questWaitForSessionStampBroker } from './quest-wait-for-session-stamp-broker';
import { questWaitForSessionStampBrokerProxy } from './quest-wait-for-session-stamp-broker.proxy';

describe('questWaitForSessionStampBroker', () => {
  describe('returns immediately when no chat workItem awaits its sessionId stamp', () => {
    it('VALID: {quest with no chaoswhisperer/glyphsmith workItem} => returns the seed quest', async () => {
      const proxy = questWaitForSessionStampBrokerProxy();
      const questId = QuestIdStub();
      const codeweaverItem = WorkItemStub({ role: 'codeweaver', status: 'pending' });
      const seed = QuestStub({ id: questId, workItems: [codeweaverItem] });
      proxy.setupSeedQuest({ quest: seed });

      const result = await questWaitForSessionStampBroker({
        questId,
        current: seed,
        deadline: Date.now() - 1,
      });

      expect(result).toStrictEqual(seed);
    });

    it('VALID: {chaoswhisperer with sessionId already stamped} => returns the seed quest without polling', async () => {
      const proxy = questWaitForSessionStampBrokerProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub();
      const stampedItem = WorkItemStub({
        role: 'chaoswhisperer',
        status: 'pending',
        sessionId,
      });
      const seed = QuestStub({ id: questId, workItems: [stampedItem] });
      proxy.setupSeedQuest({ quest: seed });

      const result = await questWaitForSessionStampBroker({
        questId,
        current: seed,
        deadline: Date.now() - 1,
      });

      expect(result).toStrictEqual(seed);
    });
  });

  describe('returns the un-stamped seed when budget is exhausted', () => {
    it('VALID: {pending chaoswhisperer with no sessionId, deadline already passed} => returns seed without retry', async () => {
      const proxy = questWaitForSessionStampBrokerProxy();
      const questId = QuestIdStub();
      const unstampedItem = WorkItemStub({ role: 'chaoswhisperer', status: 'pending' });
      const seed = QuestStub({ id: questId, workItems: [unstampedItem] });
      proxy.setupSeedQuest({ quest: seed });

      const result = await questWaitForSessionStampBroker({
        questId,
        current: seed,
        deadline: Date.now() - 1,
      });

      expect(result).toStrictEqual(seed);
    });
  });
});

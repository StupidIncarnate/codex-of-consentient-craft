import { NowMsStub } from '#gateway/node/Date/now/now-ms.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { questWaitForSessionStampBroker } from './quest-wait-for-session-stamp-broker';
import { questWaitForSessionStampBrokerProxy } from './quest-wait-for-session-stamp-broker.proxy';

describe('questWaitForSessionStampBroker', () => {
  describe('returns immediately when no chat workItem awaits its sessionId stamp', () => {
    it('VALID: {quest with no chaoswhisperer workItem} => returns the seed quest', async () => {
      const proxy = questWaitForSessionStampBrokerProxy();
      const nowMs = NowMsStub();
      proxy.setupNow({ ms: nowMs });
      const questId = QuestIdStub();
      const codeweaverItem = WorkItemStub({ role: 'codeweaver', status: 'pending' });
      const seed = QuestStub({ id: questId, workItems: [codeweaverItem] });
      proxy.setupSeedQuest({ quest: seed });

      const result = await questWaitForSessionStampBroker({
        questId,
        current: seed,
        deadline: nowMs - 1,
      });

      expect(result).toStrictEqual(seed);
    });

    it('VALID: {chaoswhisperer with sessionId already stamped} => returns the seed quest without polling', async () => {
      const proxy = questWaitForSessionStampBrokerProxy();
      const nowMs = NowMsStub();
      proxy.setupNow({ ms: nowMs });
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
        deadline: nowMs - 1,
      });

      expect(result).toStrictEqual(seed);
    });
  });

  describe('returns the un-stamped seed when budget is exhausted', () => {
    it('VALID: {pending chaoswhisperer with no sessionId, deadline already passed} => returns seed without retry', async () => {
      const proxy = questWaitForSessionStampBrokerProxy();
      const nowMs = NowMsStub();
      proxy.setupNow({ ms: nowMs });
      const questId = QuestIdStub();
      const unstampedItem = WorkItemStub({ role: 'chaoswhisperer', status: 'pending' });
      const seed = QuestStub({ id: questId, workItems: [unstampedItem] });
      proxy.setupSeedQuest({ quest: seed });

      const result = await questWaitForSessionStampBroker({
        questId,
        current: seed,
        deadline: nowMs - 1,
      });

      expect(result).toStrictEqual(seed);
    });
  });
});

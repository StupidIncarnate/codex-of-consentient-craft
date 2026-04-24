import { GuildIdStub, QuestIdStub, QuestStatusStub } from '@dungeonmaster/shared/contracts';

import { PauseActiveHeadLayerResponder } from './pause-active-head-layer-responder';
import { PauseActiveHeadLayerResponderProxy } from './pause-active-head-layer-responder.proxy';

describe('PauseActiveHeadLayerResponder', () => {
  describe('delegation to questPauseBroker', () => {
    it('VALID: {broker returns paused:true} => responder returns {paused:true} and forwards questId+guildId+previousStatus', async () => {
      const proxy = PauseActiveHeadLayerResponderProxy();
      proxy.setupPaused();
      const questId = QuestIdStub({ value: 'pause-layer-ok' });
      const guildId = GuildIdStub();
      const status = QuestStatusStub({ value: 'in_progress' });

      const result = await PauseActiveHeadLayerResponder({ questId, guildId, status });

      expect(result).toStrictEqual({ paused: true });

      const calls = proxy.getPauseBrokerCalls();
      const capturedQuestIds = calls.map((c) => c.questId);
      const capturedGuildIds = calls.map((c) => c.guildId);
      const capturedPreviousStatuses = calls.map((c) => c.previousStatus);

      expect(capturedQuestIds).toStrictEqual([questId]);
      expect(capturedGuildIds).toStrictEqual([guildId]);
      expect(capturedPreviousStatuses).toStrictEqual([status]);
    });

    it('VALID: {broker returns paused:false} => responder returns {paused:false}', async () => {
      const proxy = PauseActiveHeadLayerResponderProxy();
      proxy.setupNotPaused();

      const result = await PauseActiveHeadLayerResponder({
        questId: QuestIdStub({ value: 'pause-layer-missing' }),
        guildId: GuildIdStub(),
        status: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toStrictEqual({ paused: false });
    });
  });
});

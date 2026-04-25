import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStatusStub,
} from '@dungeonmaster/shared/contracts';

import { PauseActiveHeadLayerResponder } from './pause-active-head-layer-responder';
import { PauseActiveHeadLayerResponderProxy } from './pause-active-head-layer-responder.proxy';

describe('PauseActiveHeadLayerResponder', () => {
  describe('process kill semantics', () => {
    it('VALID: {process registered for questId} => kills that process and returns {paused: true}', async () => {
      const proxy = PauseActiveHeadLayerResponderProxy();
      const questId = QuestIdStub({ value: 'pause-layer-ok' });
      proxy.setupWithProcessForQuest({ questId });

      const result = await PauseActiveHeadLayerResponder({
        questId,
        guildId: GuildIdStub(),
        status: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toStrictEqual({ paused: true });
      expect(proxy.getKilledProcessIds()).toStrictEqual([
        ProcessIdStub({ value: 'proc-test-active' }),
      ]);
    });

    it('VALID: {no process registered for questId} => returns {paused: false} without killing anything', async () => {
      const proxy = PauseActiveHeadLayerResponderProxy();
      proxy.setupNoProcess();

      const result = await PauseActiveHeadLayerResponder({
        questId: QuestIdStub({ value: 'pause-layer-missing' }),
        guildId: GuildIdStub(),
        status: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toStrictEqual({ paused: false });
      expect(proxy.getKilledProcessIds()).toStrictEqual([]);
    });
  });
});

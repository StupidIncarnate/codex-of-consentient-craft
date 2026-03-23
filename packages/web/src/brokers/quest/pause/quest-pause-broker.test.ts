import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questPauseBroker } from './quest-pause-broker';
import { questPauseBrokerProxy } from './quest-pause-broker.proxy';

describe('questPauseBroker', () => {
  describe('successful pause', () => {
    it('VALID: {questId} => resolves with paused true', async () => {
      const proxy = questPauseBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupPause();

      const result = await questPauseBroker({ questId });

      expect(result).toStrictEqual({ paused: true });
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws error', async () => {
      const proxy = questPauseBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError();

      await expect(questPauseBroker({ questId })).rejects.toThrow(/fetch/iu);
    });
  });
});

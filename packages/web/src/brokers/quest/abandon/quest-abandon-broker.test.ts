import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questAbandonBroker } from './quest-abandon-broker';
import { questAbandonBrokerProxy } from './quest-abandon-broker.proxy';

describe('questAbandonBroker', () => {
  describe('successful abandon', () => {
    it('VALID: {questId} => resolves with abandoned true', async () => {
      const proxy = questAbandonBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupAbandon();

      const result = await questAbandonBroker({ questId });

      expect(result).toStrictEqual({ abandoned: true });
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws error', async () => {
      const proxy = questAbandonBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError();

      await expect(questAbandonBroker({ questId })).rejects.toThrow(/fetch/iu);
    });
  });
});

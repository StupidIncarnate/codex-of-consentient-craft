import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questStartBroker } from './quest-start-broker';
import { questStartBrokerProxy } from './quest-start-broker.proxy';

describe('questStartBroker', () => {
  describe('successful start', () => {
    it('VALID: {questId} => resolves with processId', async () => {
      const proxy = questStartBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupStart({ processId: 'proc-123' });

      const result = await questStartBroker({ questId });

      expect(result).toStrictEqual({ processId: 'proc-123' });
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws error', async () => {
      const proxy = questStartBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError();

      await expect(questStartBroker({ questId })).rejects.toThrow(/fetch/iu);
    });
  });
});

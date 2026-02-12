import { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questStartBroker } from './quest-start-broker';
import { questStartBrokerProxy } from './quest-start-broker.proxy';

describe('questStartBroker', () => {
  describe('successful start', () => {
    it('VALID: {questId} => returns processId', async () => {
      const proxy = questStartBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const processId = ProcessIdStub({ value: 'proc-99999' });

      proxy.setupStart({ processId });

      const result = await questStartBroker({ questId });

      expect(result).toBe(processId);
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = questStartBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError({ error: new Error('Server error') });

      await expect(questStartBroker({ questId })).rejects.toThrow('Server error');
    });
  });
});

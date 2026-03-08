import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { designStartBroker } from './design-start-broker';
import { designStartBrokerProxy } from './design-start-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

describe('designStartBroker', () => {
  describe('successful start', () => {
    it('VALID: {questId} => returns port number', async () => {
      const proxy = designStartBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-design-1' });
      const port = 5173 as unknown as Quest['designPort'];

      proxy.setupStart({ port });

      const result = await designStartBroker({ questId });

      expect(result).toStrictEqual({ port: 5173 });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = designStartBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-design-1' });

      proxy.setupError();

      await expect(designStartBroker({ questId })).rejects.toThrow(/fetch/iu);
    });
  });
});

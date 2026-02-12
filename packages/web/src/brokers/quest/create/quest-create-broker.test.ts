import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questCreateBroker } from './quest-create-broker';
import { questCreateBrokerProxy } from './quest-create-broker.proxy';

describe('questCreateBroker', () => {
  describe('successful creation', () => {
    it('VALID: {title, userRequest} => returns quest id', async () => {
      const proxy = questCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'new-quest-123' });

      proxy.setupCreate({ id: questId });

      const result = await questCreateBroker({
        title: 'Add Auth',
        userRequest: 'Implement authentication',
      });

      expect(result).toStrictEqual({ id: questId });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = questCreateBrokerProxy();

      proxy.setupError({ error: new Error('Failed to create quest') });

      await expect(
        questCreateBroker({
          title: 'Add Auth',
          userRequest: 'Implement authentication',
        }),
      ).rejects.toThrow('Failed to create quest');
    });
  });
});

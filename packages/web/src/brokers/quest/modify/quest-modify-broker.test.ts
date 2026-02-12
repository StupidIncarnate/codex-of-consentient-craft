import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { questModifyBroker } from './quest-modify-broker';
import { questModifyBrokerProxy } from './quest-modify-broker.proxy';

describe('questModifyBroker', () => {
  describe('successful modification', () => {
    it('VALID: {questId, modifications} => returns updated quest', async () => {
      const proxy = questModifyBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const updatedQuest = QuestStub({ id: 'add-auth', title: 'Updated Title' });

      proxy.setupModify({ quest: updatedQuest });

      const result = await questModifyBroker({
        questId,
        modifications: { title: 'Updated Title' },
      });

      expect(result).toStrictEqual(updatedQuest);
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = questModifyBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError({ error: new Error('Failed to modify quest') });

      await expect(
        questModifyBroker({
          questId,
          modifications: { title: 'Updated Title' },
        }),
      ).rejects.toThrow('Failed to modify quest');
    });
  });
});

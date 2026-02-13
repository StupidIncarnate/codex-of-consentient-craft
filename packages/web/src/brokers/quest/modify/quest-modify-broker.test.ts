import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questModifyBroker } from './quest-modify-broker';
import { questModifyBrokerProxy } from './quest-modify-broker.proxy';

describe('questModifyBroker', () => {
  describe('successful modification', () => {
    it('VALID: {questId, modifications} => resolves without throwing', async () => {
      const proxy = questModifyBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupModify();

      await expect(
        questModifyBroker({
          questId,
          modifications: { title: 'Updated Title' },
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('server reports failure', () => {
    it('ERROR: {success: false, error} => throws error with server message', async () => {
      const proxy = questModifyBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupFailure({ error: 'Quest not found' });

      await expect(
        questModifyBroker({
          questId,
          modifications: { title: 'Updated Title' },
        }),
      ).rejects.toThrow(/Quest not found/u);
    });

    it('ERROR: {success: false, no error field} => throws default error message', async () => {
      const proxy = questModifyBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupInvalidResponse({ data: { success: false } });

      await expect(
        questModifyBroker({
          questId,
          modifications: { title: 'Updated Title' },
        }),
      ).rejects.toThrow(/Quest modification failed/u);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws error', async () => {
      const proxy = questModifyBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError();

      await expect(
        questModifyBroker({
          questId,
          modifications: { title: 'Updated Title' },
        }),
      ).rejects.toThrow(/fetch/iu);
    });
  });
});

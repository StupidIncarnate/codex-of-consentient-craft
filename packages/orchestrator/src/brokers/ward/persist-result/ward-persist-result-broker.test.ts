import { ErrorMessageStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { wardPersistResultBroker } from './ward-persist-result-broker';
import { wardPersistResultBrokerProxy } from './ward-persist-result-broker.proxy';

describe('wardPersistResultBroker', () => {
  describe('successful persist', () => {
    it('VALID: {questFolderPath, wardResultId, detailJson} => writes file successfully', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = FilePathStub({ value: '/quests/quest-001' });
      const wardResultId = 'run-1773805659495';
      const detailJson = ErrorMessageStub({ value: '{"checks":[]}' });

      proxy.setupSuccess();

      await expect(
        wardPersistResultBroker({ questFolderPath, wardResultId, detailJson }),
      ).resolves.toBeUndefined();
    });

    it('VALID: {different inputs} => writes to correct path', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = FilePathStub({ value: '/quests/quest-002' });
      const wardResultId = 'run-abc';
      const detailJson = ErrorMessageStub({ value: '{"checks":[{"checkType":"lint"}]}' });

      proxy.setupSuccess();

      await expect(
        wardPersistResultBroker({ questFolderPath, wardResultId, detailJson }),
      ).resolves.toBeUndefined();

      expect(proxy.getWrittenContent()).toBe('{"checks":[{"checkType":"lint"}]}');
    });
  });

  describe('file path construction', () => {
    it('VALID: {questFolderPath, wardResultId} => writes to ward-results/{wardResultId}.json', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = FilePathStub({ value: '/quests/quest-003' });
      const wardResultId = 'result-xyz';
      const detailJson = ErrorMessageStub({ value: '{"checks":[]}' });

      proxy.setupSuccess();

      await wardPersistResultBroker({ questFolderPath, wardResultId, detailJson });

      expect(proxy.getWrittenPath()).toBe('/quests/quest-003/ward-results/result-xyz.json');
    });
  });

  describe('error cases', () => {
    it('ERROR: {write fails} => throws write error', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = FilePathStub({ value: '/quests/quest-001' });
      const wardResultId = 'run-fail';
      const detailJson = ErrorMessageStub({ value: '{"checks":[]}' });

      proxy.setupWriteFailure({ error: new Error('EACCES: permission denied') });

      await expect(
        wardPersistResultBroker({ questFolderPath, wardResultId, detailJson }),
      ).rejects.toThrow(/EACCES/u);
    });
  });
});

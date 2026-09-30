import { wardPersistResultBroker } from './ward-persist-result-broker';
import { wardPersistResultBrokerProxy } from './ward-persist-result-broker.proxy';

describe('wardPersistResultBroker', () => {
  describe('successful persist', () => {
    it('VALID: {questFolderPath, wardResultId, detailJson} => writes file successfully', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = '/quests/quest-001';
      const wardResultId = 'run-1773805659495';
      const detailJson = '{"checks":[]}';

      proxy.setupSuccess({ questFolderPath, wardResultId });

      await expect(
        wardPersistResultBroker({ questFolderPath, wardResultId, detailJson }),
      ).resolves.toBe(undefined);
    });

    it('VALID: {different inputs} => writes to correct path', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = '/quests/quest-002';
      const wardResultId = 'run-abc';
      const detailJson = '{"checks":[{"checkType":"lint"}]}';

      proxy.setupSuccess({ questFolderPath, wardResultId });

      await expect(
        wardPersistResultBroker({ questFolderPath, wardResultId, detailJson }),
      ).resolves.toBe(undefined);

      expect(proxy.getWrittenContent({ questFolderPath, wardResultId })).toBe(
        '{"checks":[{"checkType":"lint"}]}',
      );
    });
  });

  describe('file path construction', () => {
    it('VALID: {questFolderPath, wardResultId} => writes to ward-results/{wardResultId}.json', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = '/quests/quest-003';
      const wardResultId = 'result-xyz';
      const detailJson = '{"checks":[]}';

      proxy.setupSuccess({ questFolderPath, wardResultId });

      await wardPersistResultBroker({ questFolderPath, wardResultId, detailJson });

      expect(proxy.getWrittenPath({ questFolderPath, wardResultId })).toBe(
        '/quests/quest-003/ward-results/result-xyz.json',
      );
    });

    it('VALID: {questFolderPath, wardResultId} => creates the ward-results directory before writing', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = '/quests/quest-004';
      const wardResultId = 'result-mkdir';
      const detailJson = '{"checks":[]}';

      proxy.setupSuccess({ questFolderPath, wardResultId });

      await wardPersistResultBroker({ questFolderPath, wardResultId, detailJson });

      expect(proxy.getMkdirPaths()).toStrictEqual(['/quests/quest-004/ward-results']);
    });
  });

  describe('error cases', () => {
    it('ERROR: {write fails} => throws write error', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = '/quests/quest-001';
      const wardResultId = 'run-fail';
      const detailJson = '{"checks":[]}';

      proxy.setupWriteFailure({
        questFolderPath,
        wardResultId,
        error: new Error('EACCES: permission denied'),
      });

      await expect(
        wardPersistResultBroker({ questFolderPath, wardResultId, detailJson }),
      ).rejects.toThrow(/EACCES/u);
    });
  });
});

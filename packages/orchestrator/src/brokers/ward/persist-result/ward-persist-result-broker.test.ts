import { WardResultStub } from '@dungeonmaster/shared/contracts/ward-result/ward-result.stub';
import { wardPersistResultBroker } from './ward-persist-result-broker';
import { wardPersistResultBrokerProxy } from './ward-persist-result-broker.proxy';

describe('wardPersistResultBroker', () => {
  describe('successful persist', () => {
    it('VALID: {questFolderPath, wardResultId, detailJson} => writes file successfully', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = '/quests/quest-001';
      const wardResultId = WardResultStub({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801' }).id;
      const detailJson = '{"checks":[]}';

      proxy.setupSuccess({ questFolderPath, wardResultId });

      await expect(
        wardPersistResultBroker({ questFolderPath, wardResultId, detailJson }),
      ).resolves.toBe(undefined);
    });

    it('VALID: {different inputs} => writes to correct path', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = '/quests/quest-002';
      const wardResultId = WardResultStub({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567802' }).id;
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
      const wardResultId = WardResultStub({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567803' }).id;
      const detailJson = '{"checks":[]}';

      proxy.setupSuccess({ questFolderPath, wardResultId });

      await wardPersistResultBroker({ questFolderPath, wardResultId, detailJson });

      expect(proxy.getWrittenPath({ questFolderPath, wardResultId })).toBe(
        '/quests/quest-003/ward-results/a1b2c3d4-e5f6-7890-abcd-ef1234567803.json',
      );
    });

    it('VALID: {questFolderPath, wardResultId} => creates the ward-results directory before writing', async () => {
      const proxy = wardPersistResultBrokerProxy();
      const questFolderPath = '/quests/quest-004';
      const wardResultId = WardResultStub({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567804' }).id;
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
      const wardResultId = WardResultStub({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567805' }).id;
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

import {
  FileContentsStub,
  FilePathStub,
  RiftcarverResultStub,
} from '@dungeonmaster/shared/contracts';

import { riftcarverPersistResultBroker } from './riftcarver-persist-result-broker';
import { riftcarverPersistResultBrokerProxy } from './riftcarver-persist-result-broker.proxy';

describe('riftcarverPersistResultBroker', () => {
  describe('successful persist', () => {
    it('VALID: {questFolderPath, riftcarverResultId, logContents} => resolves success', async () => {
      const proxy = riftcarverPersistResultBrokerProxy();
      const questFolderPath = FilePathStub({ value: '/quests/001-add-auth' });
      const { id: riftcarverResultId } = RiftcarverResultStub();
      const logContents = FileContentsStub({ value: '— build pass 1/3 —\n' });

      proxy.setupSuccess({ questFolderPath, riftcarverResultId });

      await expect(
        riftcarverPersistResultBroker({ questFolderPath, riftcarverResultId, logContents }),
      ).resolves.toStrictEqual({ success: true });
    });

    it('VALID: {multi-line carve log} => writes the log verbatim', async () => {
      const proxy = riftcarverPersistResultBrokerProxy();
      const questFolderPath = FilePathStub({ value: '/quests/002-add-auth' });
      const { id: riftcarverResultId } = RiftcarverResultStub();
      const logContents = FileContentsStub({
        value: '— base branch: main —\n— build pass 1/3 —\n',
      });

      proxy.setupSuccess({ questFolderPath, riftcarverResultId });

      await riftcarverPersistResultBroker({ questFolderPath, riftcarverResultId, logContents });

      expect(proxy.getWrittenContent({ questFolderPath, riftcarverResultId })).toBe(
        '— base branch: main —\n— build pass 1/3 —\n',
      );
    });
  });

  describe('file path construction', () => {
    it('VALID: {questFolderPath, riftcarverResultId} => writes riftcarver-results/{id}.log and creates that directory', async () => {
      const proxy = riftcarverPersistResultBrokerProxy();
      const questFolderPath = FilePathStub({ value: '/quests/003-add-auth' });
      const { id: riftcarverResultId } = RiftcarverResultStub();
      const logContents = FileContentsStub({ value: 'carved\n' });

      proxy.setupSuccess({ questFolderPath, riftcarverResultId });

      await riftcarverPersistResultBroker({ questFolderPath, riftcarverResultId, logContents });

      expect(proxy.getWrittenPath({ questFolderPath, riftcarverResultId })).toBe(
        '/quests/003-add-auth/riftcarver-results/b2c3d4e5-f6a7-8901-bcde-f23456789012.log',
      );
      expect(proxy.getMkdirPaths()).toStrictEqual(['/quests/003-add-auth/riftcarver-results']);
    });
  });

  describe('error cases', () => {
    it('ERROR: {write fails} => rejects with the write error', async () => {
      const proxy = riftcarverPersistResultBrokerProxy();
      const questFolderPath = FilePathStub({ value: '/quests/004-add-auth' });
      const { id: riftcarverResultId } = RiftcarverResultStub();
      const logContents = FileContentsStub({ value: 'carved\n' });

      proxy.setupWriteFailure({
        questFolderPath,
        riftcarverResultId,
        error: new Error('EACCES: permission denied'),
      });

      await expect(
        riftcarverPersistResultBroker({ questFolderPath, riftcarverResultId, logContents }),
      ).rejects.toThrow(/EACCES/u);
    });
  });
});

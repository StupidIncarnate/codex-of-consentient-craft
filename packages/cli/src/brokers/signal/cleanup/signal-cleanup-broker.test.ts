import { signalCleanupBroker } from './signal-cleanup-broker';
import { signalCleanupBrokerProxy } from './signal-cleanup-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('signalCleanupBroker', () => {
  describe('successful cleanup operations', () => {
    it('VALID: {questsFolderPath: "/quests"} => deletes existing signal file', async () => {
      const { fsUnlinkProxy } = signalCleanupBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });

      fsUnlinkProxy.succeeds();

      await expect(signalCleanupBroker({ questsFolderPath })).resolves.toBeUndefined();
    });

    it('VALID: {questsFolderPath: "/other/path"} => resolves when file does not exist', async () => {
      const { fsUnlinkProxy } = signalCleanupBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/other/path' });

      fsUnlinkProxy.rejects({ error: new Error('ENOENT: no such file or directory') });

      await expect(signalCleanupBroker({ questsFolderPath })).resolves.toBeUndefined();
    });

    it('VALID: {questsFolderPath: "/quests"} => resolves even when permission denied', async () => {
      const { fsUnlinkProxy } = signalCleanupBrokerProxy();
      const questsFolderPath = FilePathStub({ value: '/quests' });

      fsUnlinkProxy.rejects({ error: new Error('EACCES: permission denied') });

      await expect(signalCleanupBroker({ questsFolderPath })).resolves.toBeUndefined();
    });
  });
});

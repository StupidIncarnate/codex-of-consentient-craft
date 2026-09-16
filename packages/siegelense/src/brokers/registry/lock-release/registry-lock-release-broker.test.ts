import { registryLockReleaseBroker } from './registry-lock-release-broker';
import { registryLockReleaseBrokerProxy } from './registry-lock-release-broker.proxy';

describe('registryLockReleaseBroker', () => {
  describe('lock present', () => {
    it('VALID: {registry.lock present} => removes it and returns success', async () => {
      const proxy = registryLockReleaseBrokerProxy();
      proxy.setupReleaseSucceeds();

      const result = await registryLockReleaseBroker();

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {registry.lock present} => unlinks the lock path', async () => {
      const proxy = registryLockReleaseBrokerProxy();
      proxy.setupReleaseSucceeds();

      await registryLockReleaseBroker();

      expect(proxy.getDeletedPaths()).toStrictEqual([proxy.lockPath]);
    });
  });

  describe('unlink failure', () => {
    it('ERROR: {unlink rejects} => propagates the error', async () => {
      const proxy = registryLockReleaseBrokerProxy();
      const error = new Error('EACCES: permission denied');
      proxy.setupReleaseFails({ error });

      await expect(registryLockReleaseBroker()).rejects.toThrow(/EACCES/u);
    });
  });
});

import { registryLockAcquireBroker } from './registry-lock-acquire-broker';
import { registryLockAcquireBrokerProxy } from './registry-lock-acquire-broker.proxy';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';

describe('registryLockAcquireBroker', () => {
  describe('no lock present', () => {
    it('VALID: {no registry.lock} => returns success', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      proxy.setupNow({ nowMs: EpochMsStub() });
      proxy.setupAvailable();

      const result = await registryLockAcquireBroker({});

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {no registry.lock} => the write used the exclusive flag', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      proxy.setupNow({ nowMs: EpochMsStub() });
      proxy.setupAvailable();

      await registryLockAcquireBroker({});

      expect(proxy.getLastWriteFlag()).toBe('wx');
    });
  });

  describe('stale lock', () => {
    it('VALID: {lock older than ttlMs} => takes it over and returns success', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      const nowMs = EpochMsStub();
      proxy.setupStaleHeldByAnother({ nowMs });
      proxy.setupNow({ nowMs });
      proxy.setupAvailable();

      const result = await registryLockAcquireBroker({});

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {lock older than ttlMs} => unlinks the stale file before retrying', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      const nowMs = EpochMsStub();
      proxy.setupStaleHeldByAnother({ nowMs });
      proxy.setupNow({ nowMs });
      proxy.setupAvailable();

      await registryLockAcquireBroker({});

      expect(proxy.getDeletedPaths()).toStrictEqual([proxy.lockPath]);
    });
  });

  describe('fresh lock held by another process', () => {
    it('ERROR: {lock refreshed past the wait ceiling} => throws', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      proxy.setupFreshHeldByAnotherPastCeiling();

      await expect(registryLockAcquireBroker({})).rejects.toThrow(
        /Registry lock held by another process/u,
      );
    });
  });
});

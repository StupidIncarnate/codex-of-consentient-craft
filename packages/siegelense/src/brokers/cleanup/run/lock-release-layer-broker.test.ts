import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { lockReleaseLayerBroker } from './lock-release-layer-broker';
import { lockReleaseLayerBrokerProxy } from './lock-release-layer-broker.proxy';

const NOW_MS = 1_700_000_000_000;

describe('lockReleaseLayerBroker', () => {
  describe('no locks present', () => {
    it('EMPTY: {no boot.lock, no registry.lock} => lockReleaseOutcome none-held', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupNoLocks();

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleaseOutcome: 'none-held' });
    });
  });

  describe('a fresh boot.lock', () => {
    it('VALID: {a fresh boot.lock} => lockReleaseOutcome none-held', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupBootLockFresh({
        acquiredAtMs: NOW_MS - instanceLifecycleStatics.bootLock.ttlMs + 1,
      });

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleaseOutcome: 'none-held' });
    });

    it('VALID: {a fresh boot.lock} => leaves it in place', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupBootLockFresh({
        acquiredAtMs: NOW_MS - instanceLifecycleStatics.bootLock.ttlMs + 1,
      });

      await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });

  describe('a boot.lock past its TTL', () => {
    it('VALID: {a boot.lock past its TTL} => lockReleaseOutcome released', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupBootLockStale({
        acquiredAtMs: NOW_MS - instanceLifecycleStatics.bootLock.ttlMs - 1,
      });

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleaseOutcome: 'released' });
    });

    it('VALID: {a boot.lock past its TTL} => removes boot.lock', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupBootLockStale({
        acquiredAtMs: NOW_MS - instanceLifecycleStatics.bootLock.ttlMs - 1,
      });

      await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(proxy.getDeletedPaths()).toStrictEqual([proxy.bootLockPath]);
    });
  });

  describe('a boot.lock past its TTL whose removal fails', () => {
    it('ERROR: {a boot.lock past its TTL whose unlink throws} => lockReleaseOutcome failed', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupBootLockUnlinkFails({
        acquiredAtMs: NOW_MS - instanceLifecycleStatics.bootLock.ttlMs - 1,
      });

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleaseOutcome: 'failed' });
    });
  });

  describe('a fresh registry.lock', () => {
    it('VALID: {a fresh registry.lock} => lockReleaseOutcome none-held', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupRegistryLockFresh({
        acquiredAtMs: NOW_MS - instanceLifecycleStatics.registryLock.ttlMs + 1,
      });

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleaseOutcome: 'none-held' });
    });
  });

  describe('a registry.lock past its TTL', () => {
    it('VALID: {a registry.lock past its TTL} => lockReleaseOutcome released', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupRegistryLockStale({
        acquiredAtMs: NOW_MS - instanceLifecycleStatics.registryLock.ttlMs - 1,
      });

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleaseOutcome: 'released' });
    });

    it('VALID: {a registry.lock past its TTL} => removes registry.lock', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupRegistryLockStale({
        acquiredAtMs: NOW_MS - instanceLifecycleStatics.registryLock.ttlMs - 1,
      });

      await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(proxy.getDeletedPaths()).toStrictEqual([proxy.registryLockPath]);
    });
  });

  describe('a registry.lock past its TTL whose removal fails', () => {
    it('ERROR: {a registry.lock past its TTL whose unlink throws} => lockReleaseOutcome failed', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupRegistryLockUnlinkFails({
        acquiredAtMs: NOW_MS - instanceLifecycleStatics.registryLock.ttlMs - 1,
      });

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleaseOutcome: 'failed' });
    });
  });

  describe('boot lock read fails for a reason other than absence', () => {
    it('ERROR: {the boot lock read fails for a reason other than absence} => rejects', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupBootLockReadFailsForNonAbsenceReason();

      await expect(lockReleaseLayerBroker({ nowMs: NOW_MS })).rejects.toThrow(
        'EMFILE: too many open files',
      );
    });
  });
});

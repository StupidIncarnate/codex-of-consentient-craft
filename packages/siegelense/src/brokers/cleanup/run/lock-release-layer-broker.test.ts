import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { lockReleaseLayerBroker } from './lock-release-layer-broker';
import { lockReleaseLayerBrokerProxy } from './lock-release-layer-broker.proxy';

const NOW_MS = EpochMsStub({ value: 1_700_000_000_000 });

describe('lockReleaseLayerBroker', () => {
  describe('no locks present', () => {
    it('EMPTY: {no boot.lock, no registry.lock} => lockReleased false', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupNoLocks();

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleased: false });
    });
  });

  describe('a fresh boot.lock', () => {
    it('VALID: {a fresh boot.lock} => lockReleased false', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupBootLockFresh({
        acquiredAtMs: EpochMsStub({
          value: NOW_MS - instanceLifecycleStatics.bootLock.ttlMs + 1,
        }),
      });

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleased: false });
    });

    it('VALID: {a fresh boot.lock} => leaves it in place', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupBootLockFresh({
        acquiredAtMs: EpochMsStub({
          value: NOW_MS - instanceLifecycleStatics.bootLock.ttlMs + 1,
        }),
      });

      await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });

  describe('a boot.lock past its TTL', () => {
    it('VALID: {a boot.lock past its TTL} => lockReleased true', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupBootLockStale({
        acquiredAtMs: EpochMsStub({
          value: NOW_MS - instanceLifecycleStatics.bootLock.ttlMs - 1,
        }),
      });

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleased: true });
    });

    it('VALID: {a boot.lock past its TTL} => removes boot.lock', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupBootLockStale({
        acquiredAtMs: EpochMsStub({
          value: NOW_MS - instanceLifecycleStatics.bootLock.ttlMs - 1,
        }),
      });

      await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(proxy.getDeletedPaths()).toStrictEqual([proxy.bootLockPath]);
    });
  });

  describe('a fresh registry.lock', () => {
    it('VALID: {a fresh registry.lock} => lockReleased false', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupRegistryLockFresh({
        acquiredAtMs: EpochMsStub({
          value: NOW_MS - instanceLifecycleStatics.registryLock.ttlMs + 1,
        }),
      });

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleased: false });
    });
  });

  describe('a registry.lock past its TTL', () => {
    it('VALID: {a registry.lock past its TTL} => lockReleased true', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupRegistryLockStale({
        acquiredAtMs: EpochMsStub({
          value: NOW_MS - instanceLifecycleStatics.registryLock.ttlMs - 1,
        }),
      });

      const result = await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(result).toStrictEqual({ lockReleased: true });
    });

    it('VALID: {a registry.lock past its TTL} => removes registry.lock', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupRegistryLockStale({
        acquiredAtMs: EpochMsStub({
          value: NOW_MS - instanceLifecycleStatics.registryLock.ttlMs - 1,
        }),
      });

      await lockReleaseLayerBroker({ nowMs: NOW_MS });

      expect(proxy.getDeletedPaths()).toStrictEqual([proxy.registryLockPath]);
    });
  });

  describe('boot lock read fails for a reason other than absence', () => {
    it('ERROR: {the boot lock read fails for a reason other than absence} => rejects', async () => {
      const proxy = lockReleaseLayerBrokerProxy();
      proxy.setupBootLockReadFailsForNonAbsenceReason();

      await expect(lockReleaseLayerBroker({ nowMs: NOW_MS })).rejects.toThrow(
        `Failed to read file at ${proxy.bootLockPath}`,
      );
    });
  });
});

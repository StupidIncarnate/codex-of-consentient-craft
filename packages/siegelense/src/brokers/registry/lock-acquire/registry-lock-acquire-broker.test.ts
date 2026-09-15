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

    // Reproduces the row driver-flow.integration.test.ts's parallel-boot case measured under real
    // concurrency: two contenders read the SAME stale lock and both try to remove it. The loser's
    // unlink fails ENOENT — a raw, unwrapped `fs/promises` rejection, unlike the read path's
    // `{cause}`-wrapped one — and that must be classified as benign (a competitor already cleared
    // it) rather than escaping to the caller.
    it('EDGE: {two contenders race to remove the same stale lock} => the loser retries instead of throwing', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      const nowMs = EpochMsStub();
      proxy.setupStaleUnlinkLostRaceToAnotherContender({ nowMs });
      proxy.setupNow({ nowMs });
      proxy.setupAvailable();

      const result = await registryLockAcquireBroker({});

      expect(result).toStrictEqual({ success: true });
    });

    it('ERROR: {the stale-lock unlink fails for a reason other than absence} => throws', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      const nowMs = EpochMsStub();
      proxy.setupStaleUnlinkFailsForNonAbsenceReason({ nowMs });
      proxy.setupNow({ nowMs });

      await expect(registryLockAcquireBroker({})).rejects.toThrow(/EACCES/u);
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

  describe('lock read fails for a reason other than absence', () => {
    it('ERROR: {the lock read fails for a reason other than absence} => does not loop forever', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      proxy.setupNow({ nowMs: EpochMsStub() });
      proxy.setupLockReadFailsForNonAbsenceReason();

      await expect(registryLockAcquireBroker({})).rejects.toThrow(
        `Failed to read file at ${proxy.lockPath}`,
      );
    }, 1000);
  });

  describe('lock vanishes between the failed create and the read', () => {
    it('EDGE: {the lock vanishes between the failed create and the read} => retries the create', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      proxy.setupNow({ nowMs: EpochMsStub() });
      proxy.setupLockVanishesBeforeRetryRead();
      proxy.setupAvailable();

      const result = await registryLockAcquireBroker({});

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('a fresh home with no siegelense root yet', () => {
    it('EDGE: {no siegelense root yet} => creates the root directory before acquiring the lock', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      proxy.setupNow({ nowMs: EpochMsStub() });
      proxy.setupAvailable();

      await registryLockAcquireBroker({});

      expect(proxy.getCreatedDirs()).toStrictEqual([proxy.rootPath]);
    });

    it('VALID: {no siegelense root yet} => the create is still exclusive, not a plain overwrite', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      proxy.setupNow({ nowMs: EpochMsStub() });
      proxy.setupAvailable();

      await registryLockAcquireBroker({});

      expect(proxy.getLastWriteFlag()).toBe('wx');
    });

    it('VALID: {siegelense root already has files in it} => mkdir leaves them alone', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      proxy.setupNow({ nowMs: EpochMsStub() });
      proxy.setupAvailable();

      await registryLockAcquireBroker({});

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });

  describe('registry.lock already held by another process', () => {
    it('VALID: {registry.lock already held by another process} => the failed create still used the exclusive flag', async () => {
      const proxy = registryLockAcquireBrokerProxy();
      proxy.setupFreshHeldByAnotherPastCeiling();

      await registryLockAcquireBroker({}).catch((error: unknown) => error);

      expect(proxy.getLastWriteFlag()).toBe('wx');
    });
  });
});

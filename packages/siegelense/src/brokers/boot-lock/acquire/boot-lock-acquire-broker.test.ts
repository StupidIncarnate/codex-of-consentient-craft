import { bootLockAcquireBroker } from './boot-lock-acquire-broker';
import { bootLockAcquireBrokerProxy } from './boot-lock-acquire-broker.proxy';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

describe('bootLockAcquireBroker', () => {
  describe('no lock present', () => {
    it('EMPTY: {no boot.lock} => writes and returns a fresh lock for this instance', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const nowMs = EpochMsStub();

      proxy.setupNow({ nowMs });
      proxy.setupWriteSucceeds();

      const result = await bootLockAcquireBroker({ instanceId });

      expect(result).toStrictEqual({
        lock: {
          heldBy: instanceId,
          heldByPid: ProcessIdStub({ value: String(process.pid) }),
          acquiredAtMs: nowMs,
        },
        tookOverStale: false,
      });
    });

    it('EMPTY: {no boot.lock} => writes the same lock it returns', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const nowMs = EpochMsStub();

      proxy.setupNow({ nowMs });
      proxy.setupWriteSucceeds();

      const result = await bootLockAcquireBroker({ instanceId });

      expect(proxy.getWrittenLock()).toStrictEqual(result.lock);
    });

    it('VALID: {absent lock} => the write used the exclusive flag', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const nowMs = EpochMsStub();

      proxy.setupNow({ nowMs });
      proxy.setupWriteSucceeds();

      await bootLockAcquireBroker({ instanceId });

      expect(proxy.getLastWriteFlag()).toBe('wx');
    });
  });

  describe('fresh lock held by another instance', () => {
    it('ERROR: {lock heldBy: another instance, refreshed past the wait ceiling} => throws BootLockHeldError', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });

      const { expectedError } = proxy.setupFreshLockHeldByAnotherPastCeiling({
        otherInstanceId,
      });

      await expect(bootLockAcquireBroker({ instanceId })).rejects.toThrow(expectedError.message);
    });

    it('EDGE: {RACE: exclusive create loses to a competitor} => falls through to the held branch, never overwrites', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });

      const { expectedError } = proxy.setupFreshLockHeldByAnotherPastCeiling({
        otherInstanceId,
      });

      await expect(bootLockAcquireBroker({ instanceId })).rejects.toThrow(expectedError.message);
      expect(proxy.getLastWriteFlag()).toBe('wx');
    });
  });

  describe('lock read fails for a reason other than absence', () => {
    it('ERROR: {the lock read fails for a reason other than absence} => does not loop forever', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });

      proxy.setupNow({ nowMs: EpochMsStub() });
      proxy.setupLockReadFailsForNonAbsenceReason();

      await expect(bootLockAcquireBroker({ instanceId })).rejects.toThrow(
        `Failed to read file at ${proxy.bootLockPath}`,
      );
    }, 1000);
  });

  describe('lock vanishes between the failed create and the read', () => {
    it('EDGE: {the lock vanishes between the failed create and the read} => retries the create', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const nowMs = EpochMsStub();

      proxy.setupNow({ nowMs });
      proxy.setupLockVanishesBeforeRetryRead();
      proxy.setupWriteSucceeds();

      const result = await bootLockAcquireBroker({ instanceId });

      expect(result).toStrictEqual({
        lock: {
          heldBy: instanceId,
          heldByPid: ProcessIdStub({ value: String(process.pid) }),
          acquiredAtMs: nowMs,
        },
        tookOverStale: false,
      });
    });
  });

  describe('stale lock', () => {
    it('VALID: {lock heldBy: another instance, acquiredAtMs older than ttlMs} => takes the lock over for this instance', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const nowMs = EpochMsStub();

      proxy.setupStaleLockHeldBy({ otherInstanceId, nowMs });
      proxy.setupNow({ nowMs });
      proxy.setupWriteSucceeds();

      const result = await bootLockAcquireBroker({ instanceId });

      expect(result).toStrictEqual({
        lock: {
          heldBy: instanceId,
          heldByPid: ProcessIdStub({ value: String(process.pid) }),
          acquiredAtMs: nowMs,
        },
        tookOverStale: true,
      });
    });

    it('VALID: {lock heldBy: another instance, acquiredAtMs older than ttlMs} => writes the takeover to boot.lock', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const nowMs = EpochMsStub();

      proxy.setupStaleLockHeldBy({ otherInstanceId, nowMs });
      proxy.setupNow({ nowMs });
      proxy.setupWriteSucceeds();

      const result = await bootLockAcquireBroker({ instanceId });

      expect(proxy.getWrittenLock()).toStrictEqual(result.lock);
    });

    it('VALID: {stale lock} => the return says a takeover happened', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const nowMs = EpochMsStub();

      proxy.setupStaleLockHeldBy({ otherInstanceId, nowMs });
      proxy.setupNow({ nowMs });
      proxy.setupWriteSucceeds();

      const result = await bootLockAcquireBroker({ instanceId });

      expect(result.tookOverStale).toBe(true);
    });

    it('EDGE: {RACE: stale takeover loses the re-create} => does not stamp over the live lock', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });

      const { expectedError } = proxy.setupStaleTakeoverLosesRetryRace({ otherInstanceId });

      await expect(bootLockAcquireBroker({ instanceId })).rejects.toThrow(expectedError.message);
      expect(proxy.getLastWriteFlag()).toBe('wx');
    });

    // Reproduces the row driver-flow.integration.test.ts's parallel-boot case measured under real
    // concurrency: two contenders read the SAME stale lock and both try to remove it. The loser's
    // unlink fails ENOENT — a raw, unwrapped `fs/promises` rejection, unlike the read path's
    // `{cause}`-wrapped one — and that must be classified as benign (a competitor already cleared
    // it) rather than escaping to the caller.
    it('EDGE: {two contenders race to remove the same stale lock} => the loser retries instead of throwing', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const nowMs = EpochMsStub();

      proxy.setupStaleUnlinkLostRaceToAnotherContender({ otherInstanceId, nowMs });
      proxy.setupNow({ nowMs });
      proxy.setupWriteSucceeds();

      const result = await bootLockAcquireBroker({ instanceId });

      expect(result).toStrictEqual({
        lock: {
          heldBy: instanceId,
          heldByPid: ProcessIdStub({ value: String(process.pid) }),
          acquiredAtMs: nowMs,
        },
        tookOverStale: true,
      });
    });

    it('ERROR: {the stale-lock unlink fails for a reason other than absence} => throws', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const nowMs = EpochMsStub();

      proxy.setupStaleUnlinkFailsForNonAbsenceReason({ otherInstanceId, nowMs });
      proxy.setupNow({ nowMs });

      await expect(bootLockAcquireBroker({ instanceId })).rejects.toThrow(/EACCES/u);
    });
  });

  describe('a fresh home with no siegelense root yet', () => {
    it('EDGE: {no siegelense root yet} => creates the root directory before acquiring the lock', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const nowMs = EpochMsStub();

      proxy.setupNow({ nowMs });
      proxy.setupWriteSucceeds();

      await bootLockAcquireBroker({ instanceId });

      expect(proxy.getCreatedDirs()).toStrictEqual([proxy.rootPath]);
    });

    it('VALID: {no siegelense root yet} => the create is still exclusive, not a plain overwrite', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const nowMs = EpochMsStub();

      proxy.setupNow({ nowMs });
      proxy.setupWriteSucceeds();

      await bootLockAcquireBroker({ instanceId });

      expect(proxy.getLastWriteFlag()).toBe('wx');
    });
  });

  describe('boot.lock already held by another instance', () => {
    it('VALID: {boot.lock already held by another instance} => the failed create still used the exclusive flag', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });

      proxy.setupFreshLockHeldByAnotherPastCeiling({ otherInstanceId });

      await bootLockAcquireBroker({ instanceId }).catch((error: unknown) => error);

      expect(proxy.getLastWriteFlag()).toBe('wx');
    });

    it('ERROR: {boot.lock already held by another instance} => a second acquire against the held lock still throws', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });

      const { expectedError } = proxy.setupFreshLockHeldByAnotherPastCeiling({ otherInstanceId });

      const thrownError = await bootLockAcquireBroker({ instanceId }).catch(
        (error: unknown) => error,
      );

      expect(String(thrownError)).toBe(String(expectedError));
    });
  });

  describe('lock already held by this instance', () => {
    it('VALID: {lock heldBy: this instance} => returns the existing lock unchanged, without writing', async () => {
      const proxy = bootLockAcquireBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const heldByPid = ProcessIdStub();
      const acquiredAtMs = EpochMsStub();

      proxy.setupLockHeldBy({ heldBy: instanceId, heldByPid, acquiredAtMs });
      proxy.setupNow({ nowMs: EpochMsStub() });

      const result = await bootLockAcquireBroker({ instanceId });

      expect(result).toStrictEqual({
        lock: { heldBy: instanceId, heldByPid, acquiredAtMs },
        tookOverStale: false,
      });
    });
  });
});

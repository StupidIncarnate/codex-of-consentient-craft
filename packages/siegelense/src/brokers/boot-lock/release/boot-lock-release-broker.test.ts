import { bootLockReleaseBroker } from './boot-lock-release-broker';
import { bootLockReleaseBrokerProxy } from './boot-lock-release-broker.proxy';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';

describe('bootLockReleaseBroker', () => {
  describe('no lock present', () => {
    it('EMPTY: {no boot.lock} => nothing to remove, returns success', async () => {
      const proxy = bootLockReleaseBrokerProxy();
      const instanceId = InstanceIdStub();

      proxy.setupNoLock();

      await expect(bootLockReleaseBroker({ instanceId })).resolves.toBe(undefined);
    });

    it('EMPTY: {no boot.lock} => records no deletion', async () => {
      const proxy = bootLockReleaseBrokerProxy();
      const instanceId = InstanceIdStub();

      proxy.setupNoLock();

      await bootLockReleaseBroker({ instanceId });

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });

  describe('lock read fails for a reason other than absence', () => {
    it('ERROR: {the lock read fails for a reason other than absence} => does not report success', async () => {
      const proxy = bootLockReleaseBrokerProxy();
      const instanceId = InstanceIdStub();

      proxy.setupLockReadFailsForNonAbsenceReason();

      await expect(bootLockReleaseBroker({ instanceId })).rejects.toThrow(
        'EMFILE: too many open files',
      );
      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });

  describe('lock held by this instance', () => {
    it('VALID: {lock heldBy: this instance} => removes boot.lock', async () => {
      const proxy = bootLockReleaseBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });

      proxy.setupLockHeldBy({
        heldBy: instanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs: 1,
      });

      await bootLockReleaseBroker({ instanceId });

      expect(proxy.getDeletedPaths()).toStrictEqual([proxy.bootLockPath]);
    });

    it('VALID: {lock heldBy: this instance} => returns success', async () => {
      const proxy = bootLockReleaseBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });

      proxy.setupLockHeldBy({
        heldBy: instanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs: 1,
      });

      await expect(bootLockReleaseBroker({ instanceId })).resolves.toBe(undefined);
    });
  });

  describe('lock held by another instance', () => {
    it('VALID: {lock heldBy: another instance} => leaves boot.lock in place', async () => {
      const proxy = bootLockReleaseBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });

      proxy.setupLockHeldBy({
        heldBy: otherInstanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs: 1,
      });

      await bootLockReleaseBroker({ instanceId });

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });

    it('VALID: {lock heldBy: another instance} => still returns success', async () => {
      const proxy = bootLockReleaseBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_1a2b3c4d' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_deadbeef' });

      proxy.setupLockHeldBy({
        heldBy: otherInstanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs: 1,
      });

      await expect(bootLockReleaseBroker({ instanceId })).resolves.toBe(undefined);
    });
  });
});

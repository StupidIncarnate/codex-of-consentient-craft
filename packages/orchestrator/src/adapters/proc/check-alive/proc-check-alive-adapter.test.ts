import { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';
import { procCheckAliveAdapter } from './proc-check-alive-adapter';
import { procCheckAliveAdapterProxy } from './proc-check-alive-adapter.proxy';

describe('procCheckAliveAdapter', () => {
  describe('process alive', () => {
    it('VALID: {pid: 812325, kill(0) returns} => true', () => {
      const proxy = procCheckAliveAdapterProxy();
      const pid = ProcessPidStub({ value: 812325 });
      proxy.setupAlive({ pid });

      const result = procCheckAliveAdapter({ pid });

      expect(result).toBe(true);
    });

    it('VALID: {pid: 1, EPERM error} => true (kernel owned by root, but still alive)', () => {
      const proxy = procCheckAliveAdapterProxy();
      const pid = ProcessPidStub({ value: 1 });
      proxy.setupPermissionDenied({ pid });

      const result = procCheckAliveAdapter({ pid });

      expect(result).toBe(true);
    });
  });

  describe('process dead', () => {
    it('VALID: {pid: 99999, ESRCH error} => false', () => {
      const proxy = procCheckAliveAdapterProxy();
      const pid = ProcessPidStub({ value: 99999 });
      proxy.setupDead({ pid });

      const result = procCheckAliveAdapter({ pid });

      expect(result).toBe(false);
    });
  });

  describe('error passthrough', () => {
    it('ERROR: {unknown error code} => rethrows', () => {
      const proxy = procCheckAliveAdapterProxy();
      const pid = ProcessPidStub({ value: 123 });
      const error = new Error('kill EINVAL') as NodeJS.ErrnoException;
      error.code = 'EINVAL';
      proxy.setupUnknownError({ pid, error });

      expect(() => procCheckAliveAdapter({ pid })).toThrow('kill EINVAL');
    });
  });
});

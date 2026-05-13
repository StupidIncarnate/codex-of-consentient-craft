import { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';
import { procCheckAliveAdapter } from './proc-check-alive-adapter';
import { procCheckAliveAdapterProxy } from './proc-check-alive-adapter.proxy';

describe('procCheckAliveAdapter', () => {
  describe('process alive', () => {
    it('VALID: {pid: 812325, kill(0) returns} => true', () => {
      const proxy = procCheckAliveAdapterProxy();
      proxy.setupAlive();

      const result = procCheckAliveAdapter({ pid: ProcessPidStub({ value: 812325 }) });

      expect(result).toBe(true);
    });

    it('VALID: {pid: 1, EPERM error} => true (kernel owned by root, but still alive)', () => {
      const proxy = procCheckAliveAdapterProxy();
      proxy.setupPermissionDenied();

      const result = procCheckAliveAdapter({ pid: ProcessPidStub({ value: 1 }) });

      expect(result).toBe(true);
    });
  });

  describe('process dead', () => {
    it('VALID: {pid: 99999, ESRCH error} => false', () => {
      const proxy = procCheckAliveAdapterProxy();
      proxy.setupDead();

      const result = procCheckAliveAdapter({ pid: ProcessPidStub({ value: 99999 }) });

      expect(result).toBe(false);
    });
  });

  describe('error passthrough', () => {
    it('ERROR: {unknown error code} => rethrows', () => {
      const proxy = procCheckAliveAdapterProxy();
      const error = new Error('kill EINVAL') as NodeJS.ErrnoException;
      error.code = 'EINVAL';
      proxy.setupUnknownError({ error });

      expect(() => procCheckAliveAdapter({ pid: ProcessPidStub({ value: 123 }) })).toThrow(
        'kill EINVAL',
      );
    });
  });
});

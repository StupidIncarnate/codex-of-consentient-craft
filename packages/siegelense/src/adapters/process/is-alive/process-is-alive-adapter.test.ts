import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { processIsAliveAdapter } from './process-is-alive-adapter';
import { processIsAliveAdapterProxy } from './process-is-alive-adapter.proxy';

describe('processIsAliveAdapter', () => {
  describe('a live group', () => {
    it('VALID: {alive group} => returns true', () => {
      const proxy = processIsAliveAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupAlive({ pgid });

      const result = processIsAliveAdapter({ pgid });

      expect(result).toBe(true);
    });

    it('VALID: {pgid: 4821} => probes the NEGATED pgid with signal 0, not a real signal', () => {
      const proxy = processIsAliveAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupAlive({ pgid });

      processIsAliveAdapter({ pgid });

      expect(proxy.getCallFor({ pgid })).toStrictEqual([-4821, 0]);
    });
  });

  describe('a group that already exited', () => {
    it('ERROR: {ESRCH} => isAlive returns false', () => {
      const proxy = processIsAliveAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 99_999 });
      proxy.setupGone({ pgid });

      const result = processIsAliveAdapter({ pgid });

      expect(result).toBe(false);
    });
  });

  describe('a real failure', () => {
    it('ERROR: {EPERM} => rethrows rather than reporting false', () => {
      const proxy = processIsAliveAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      const error = new Error('kill EPERM') as NodeJS.ErrnoException;
      error.code = 'EPERM';
      proxy.setupUnknownError({ pgid, error });

      expect(() => processIsAliveAdapter({ pgid })).toThrow('kill EPERM');
    });
  });
});

import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { processKillGroupAdapter } from './process-kill-group-adapter';
import { processKillGroupAdapterProxy } from './process-kill-group-adapter.proxy';

describe('processKillGroupAdapter', () => {
  describe('targeting the process group', () => {
    it('VALID: {pgid: 4821, signal: SIGTERM} => targets the NEGATED pgid, not the bare pgid', () => {
      const proxy = processKillGroupAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupSent({ pgid, signal: 'SIGTERM' });

      processKillGroupAdapter({ pgid, signal: 'SIGTERM' });

      expect(proxy.getCallsFor({ pgid })).toStrictEqual(['SIGTERM']);
    });

    it('VALID: {pgid, signal: SIGTERM} => returns signalSent:true for a live group', () => {
      const proxy = processKillGroupAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupSent({ pgid, signal: 'SIGTERM' });

      const result = processKillGroupAdapter({ pgid, signal: 'SIGTERM' });

      expect(result).toStrictEqual({ success: true, signalSent: true });
    });
  });

  describe('the SIGTERM-then-SIGKILL escalation', () => {
    it('VALID: {SIGTERM called, then SIGKILL called} => the two signals land in that order', () => {
      const proxy = processKillGroupAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupSent({ pgid, signal: 'SIGTERM' });
      proxy.setupSent({ pgid, signal: 'SIGKILL' });

      processKillGroupAdapter({ pgid, signal: 'SIGTERM' });
      processKillGroupAdapter({ pgid, signal: 'SIGKILL' });

      expect(proxy.getCallsFor({ pgid })).toStrictEqual(['SIGTERM', 'SIGKILL']);
    });
  });

  describe('a pgid whose process already exited', () => {
    it('EDGE: {ESRCH on SIGKILL} => returns signalSent:false without throwing', () => {
      const proxy = processKillGroupAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupAlreadyGone({ pgid, signal: 'SIGKILL' });

      const result = processKillGroupAdapter({ pgid, signal: 'SIGKILL' });

      expect(result).toStrictEqual({ success: true, signalSent: false });
    });
  });

  describe('a real failure', () => {
    it('ERROR: {EPERM} => rethrows rather than reporting signalSent:false', () => {
      const proxy = processKillGroupAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      const error = new Error('kill EPERM') as NodeJS.ErrnoException;
      error.code = 'EPERM';
      proxy.setupUnknownError({ pgid, signal: 'SIGTERM', error });

      expect(() => processKillGroupAdapter({ pgid, signal: 'SIGTERM' })).toThrow('kill EPERM');
    });
  });
});

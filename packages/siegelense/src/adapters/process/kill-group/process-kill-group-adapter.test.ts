import { runInNewContext } from 'vm';

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

  // Realm-safety, proven the way error-is-native-error-adapter.test.ts proves it:
  // `vm.runInNewContext` builds this ESRCH the same way Node's own `process.kill` internals do —
  // with a DIFFERENT realm's Error constructor — so `crossRealmEsrch instanceof Error` reads
  // false even though it genuinely is one. A pre-fix `error instanceof Error` check would take
  // this branch's `throw error` path instead of reporting the gone group as success.
  describe('ESRCH built in a different vm realm', () => {
    it('EDGE: {ESRCH from a cross-realm Error} => returns signalSent:false without throwing', () => {
      const proxy = processKillGroupAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      const crossRealmEsrch: unknown = runInNewContext(
        'const e = new Error("kill ESRCH"); e.code = "ESRCH"; e;',
      );

      expect(crossRealmEsrch instanceof Error).toBe(false);

      proxy.setupUnknownError({ pgid, signal: 'SIGKILL', error: crossRealmEsrch });

      const result = processKillGroupAdapter({ pgid, signal: 'SIGKILL' });

      expect(result).toStrictEqual({ success: true, signalSent: false });
    });
  });
});

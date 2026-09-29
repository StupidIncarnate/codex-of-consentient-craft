import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { processKillGroupBroker } from './process-kill-group-broker';
import { processKillGroupBrokerProxy } from './process-kill-group-broker.proxy';

describe('processKillGroupBroker', () => {
  describe('targeting the process group', () => {
    it('VALID: {pgid: 4821, signal: SIGTERM} => targets the NEGATED pgid, not the bare pgid', () => {
      const proxy = processKillGroupBrokerProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupSent({ pgid, signal: 'SIGTERM' });

      processKillGroupBroker({ pgid, signal: 'SIGTERM' });

      expect(proxy.getCallsFor({ pgid })).toStrictEqual(['SIGTERM']);
    });

    it('VALID: {pgid, signal: SIGTERM} => returns signalSent:true for a live group', () => {
      const proxy = processKillGroupBrokerProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupSent({ pgid, signal: 'SIGTERM' });

      const result = processKillGroupBroker({ pgid, signal: 'SIGTERM' });

      expect(result).toStrictEqual({ signalSent: true });
    });
  });

  describe('the SIGTERM-then-SIGKILL escalation', () => {
    it('VALID: {SIGTERM called, then SIGKILL called} => the two signals land in that order', () => {
      const proxy = processKillGroupBrokerProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupSent({ pgid, signal: 'SIGTERM' });
      proxy.setupSent({ pgid, signal: 'SIGKILL' });

      processKillGroupBroker({ pgid, signal: 'SIGTERM' });
      processKillGroupBroker({ pgid, signal: 'SIGKILL' });

      expect(proxy.getCallsFor({ pgid })).toStrictEqual(['SIGTERM', 'SIGKILL']);
    });
  });

  describe('a pgid whose process already exited', () => {
    it('EDGE: {ESRCH on SIGKILL} => returns signalSent:false without throwing', () => {
      const proxy = processKillGroupBrokerProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupAlreadyGone({ pgid, signal: 'SIGKILL' });

      const result = processKillGroupBroker({ pgid, signal: 'SIGKILL' });

      expect(result).toStrictEqual({ signalSent: false });
    });
  });

  describe('a real failure', () => {
    it('ERROR: {EPERM} => rethrows rather than reporting signalSent:false', () => {
      const proxy = processKillGroupBrokerProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      const error = FsErrorStub({ code: 'EPERM', syscall: 'kill' });
      proxy.setupUnknownError({ pgid, signal: 'SIGTERM', error });

      expect(() => processKillGroupBroker({ pgid, signal: 'SIGTERM' })).toThrow(
        /^EPERM: kill ''$/u,
      );
    });
  });
});

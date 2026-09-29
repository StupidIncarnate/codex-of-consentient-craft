import { kill } from './kill';
import { killProxy } from './kill.proxy';
import { ProcessKillRecordedErrorStub } from './process-kill-recorded-error.stub';

describe('kill', () => {
  describe('a signal that lands', () => {
    it('VALID: {targetPid, signal: SIGTERM} => returns true and calls process.kill with both', () => {
      const proxy = killProxy();
      proxy.setupSent({ pid: 1234, signal: 'SIGTERM' });

      const result = kill(1234, 'SIGTERM');

      expect(result).toBe(true);
      expect(proxy.getCallsFor({ pid: 1234 })).toStrictEqual([[1234, 'SIGTERM']]);
    });

    it('EMPTY: {signal omitted} => calls process.kill with undefined for the signal', () => {
      const proxy = killProxy();
      proxy.setupSent({ pid: 4321, signal: undefined });

      kill(4321);

      expect(proxy.getCallsFor({ pid: 4321 })).toStrictEqual([[4321, undefined]]);
    });

    it('VALID: {onSent} => runs onSent as the signal lands', () => {
      const proxy = killProxy();
      const landed: unknown[] = [];
      proxy.setupSent({
        pid: 1234,
        signal: 'SIGKILL',
        onSent: () => {
          landed.push('SIGKILL');
        },
      });

      kill(1234, 'SIGKILL');

      expect(landed).toStrictEqual(['SIGKILL']);
    });

    it('VALID: {probe and SIGTERM staged apart on one pid} => each call answers its own stage', () => {
      const proxy = killProxy();
      proxy.setupSent({ pid: 1234, signal: 0 });
      proxy.setupNotFound({ pid: 1234, signal: 'SIGTERM' });

      const probe = kill(1234, 0);

      expect(probe).toBe(true);
      expect(() => kill(1234, 'SIGTERM')).toThrow(/^kill ESRCH$/u);
      expect(proxy.getCallsFor({ pid: 1234 })).toStrictEqual([
        [1234, 0],
        [1234, 'SIGTERM'],
      ]);
    });

    it('VALID: {targetPid: process.pid, signal: 0} => the real process.kill answers true', () => {
      expect(kill(process.pid, 0)).toBe(true);
    });
  });

  describe('a signal that fails', () => {
    it('ERROR: {setupNotFound} => throws the recorded ESRCH', async () => {
      const proxy = killProxy();
      proxy.setupNotFound({ pid: 99_999, signal: 'SIGTERM' });
      const recorded = ProcessKillRecordedErrorStub({ code: 'ESRCH' });

      const caught: unknown = await Promise.resolve()
        .then(() => kill(99_999, 'SIGTERM'))
        .catch((error: unknown) => error);
      const error = caught as NodeJS.ErrnoException;

      expect({ ...error, message: error.message }).toStrictEqual({
        ...recorded,
        message: recorded.message,
      });
    });

    it('ERROR: {setupPermissionDenied} => throws the recorded EPERM', () => {
      const proxy = killProxy();
      proxy.setupPermissionDenied({ pid: 1, signal: 0 });

      expect(() => kill(1, 0)).toThrow(/^kill EPERM$/u);
    });

    it('ERROR: {setupInvalidSignal} => throws the recorded EINVAL', () => {
      const proxy = killProxy();
      proxy.setupInvalidSignal({ pid: 1234, signal: 999 });

      expect(() => kill(1234, 999)).toThrow(/^kill EINVAL$/u);
    });

    it('VALID: {setupSentThenNotFound} => lands once, then throws the recorded ESRCH', () => {
      const proxy = killProxy();
      proxy.setupSentThenNotFound({ pid: 4821, signal: 0 });

      const first = kill(4821, 0);

      expect(first).toBe(true);
      expect(() => kill(4821, 0)).toThrow(/^kill ESRCH$/u);
    });
  });
});

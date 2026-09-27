import { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';
import { processSignalAdapter } from './process-signal-adapter';
import { processSignalAdapterProxy } from './process-signal-adapter.proxy';

const PID = ProcessPidStub({ value: 4_753 });

describe('processSignalAdapter', () => {
  describe('liveness probe (signal=0)', () => {
    it('VALID: {pid is alive} => returns true', () => {
      const proxy = processSignalAdapterProxy();
      proxy.setupAlive({ pid: PID });

      const result = processSignalAdapter({ pid: PID, signal: 0 });

      expect(result).toBe(true);
    });

    it('VALID: {pid is gone (ESRCH)} => returns false', () => {
      const proxy = processSignalAdapterProxy();
      proxy.setupDead({ pid: PID });

      const result = processSignalAdapter({ pid: PID, signal: 0 });

      expect(result).toBe(false);
    });
  });
});

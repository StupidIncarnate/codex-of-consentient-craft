import { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';
import { processSignalAdapter } from './process-signal-adapter';
import { processSignalAdapterProxy } from './process-signal-adapter.proxy';

const CURRENT_PID = ProcessPidStub({ value: process.pid });
// A very high PID that is extremely unlikely to be in use; Linux default pid_max is 4194304,
// picking a value above that guarantees ESRCH on all reasonable hosts.
const DEAD_PID = ProcessPidStub({ value: 4_999_999 });

describe('processSignalAdapter', () => {
  describe('liveness probe (signal=0)', () => {
    it('VALID: {current process pid} => returns true (process is alive)', () => {
      processSignalAdapterProxy();

      const result = processSignalAdapter({ pid: CURRENT_PID, signal: 0 });

      expect(result).toBe(true);
    });

    it('VALID: {pid above pid_max} => returns false (process is gone)', () => {
      processSignalAdapterProxy();

      const result = processSignalAdapter({ pid: DEAD_PID, signal: 0 });

      expect(result).toBe(false);
    });
  });
});

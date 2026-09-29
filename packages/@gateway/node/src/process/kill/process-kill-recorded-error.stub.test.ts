import { ProcessNotFoundErrorStub } from './process-not-found-error.stub';
import { ProcessKillRecordedErrorStub } from './process-kill-recorded-error.stub';

// The init process (pid 1) belongs to root, so a non-root test run is refused with EPERM; signal
// 999 is past every signal number the kernel defines, so it is refused with EINVAL.
const INIT_PID = 1;
const UNKNOWN_SIGNAL_NUMBER = 999;

describe('ProcessKillRecordedErrorStub', () => {
  it('VALID: {code: ESRCH} => matches a real ESRCH field for field', async () => {
    const real = await ProcessNotFoundErrorStub();
    const recorded = ProcessKillRecordedErrorStub({ code: 'ESRCH' });

    expect({
      message: recorded.message,
      errno: recorded.errno,
      code: recorded.code,
      syscall: recorded.syscall,
    }).toStrictEqual({
      message: real.message,
      errno: real.errno,
      code: real.code,
      syscall: real.syscall,
    });
  });

  it('VALID: {code: EPERM} => matches a real EPERM from signalling init field for field', async () => {
    const caught: unknown = await Promise.resolve()
      .then(() => process.kill(INIT_PID, 0))
      .catch((error: unknown) => error);
    const real = caught as NodeJS.ErrnoException;
    const recorded = ProcessKillRecordedErrorStub({ code: 'EPERM' });

    expect({
      message: recorded.message,
      errno: recorded.errno,
      code: recorded.code,
      syscall: recorded.syscall,
    }).toStrictEqual({
      message: real.message,
      errno: real.errno,
      code: real.code,
      syscall: real.syscall,
    });
  });

  it('VALID: {code: EINVAL} => matches a real EINVAL from an unknown signal number field for field', async () => {
    const caught: unknown = await Promise.resolve()
      .then(() => process.kill(process.pid, UNKNOWN_SIGNAL_NUMBER))
      .catch((error: unknown) => error);
    const real = caught as NodeJS.ErrnoException;
    const recorded = ProcessKillRecordedErrorStub({ code: 'EINVAL' });

    expect({
      message: recorded.message,
      errno: recorded.errno,
      code: recorded.code,
      syscall: recorded.syscall,
    }).toStrictEqual({
      message: real.message,
      errno: real.errno,
      code: real.code,
      syscall: real.syscall,
    });
  });
});

/**
 * PURPOSE: The three errors a real `process.kill` raises, held as data so a caller's proxy can
 * stage one synchronously without signalling anything — a composing package's unit run traps
 * `process.kill`, which capturing the real error needs. `ESRCH` is a pid that no longer exists,
 * `EPERM` a pid owned by another user, `EINVAL` a signal number the kernel does not know. Its test
 * provokes each one for real and asserts this stub matches it field for field, so the shape cannot
 * drift from what Node and the OS actually raise. Reach for `ProcessNotFoundErrorStub` instead only
 * where a test must capture a live ESRCH itself.
 *
 * USAGE:
 * const error = ProcessKillRecordedErrorStub({ code: 'ESRCH' });
 * // Returns { message: 'kill ESRCH', errno: -3, code: 'ESRCH', syscall: 'kill' }
 */
import { constants } from 'os';

export const ProcessKillRecordedErrorStub = ({
  code,
}: {
  code: 'ESRCH' | 'EPERM' | 'EINVAL';
}): NodeJS.ErrnoException =>
  Object.assign(new Error(`kill ${code}`), {
    errno: -constants.errno[code],
    code,
    syscall: 'kill',
  });

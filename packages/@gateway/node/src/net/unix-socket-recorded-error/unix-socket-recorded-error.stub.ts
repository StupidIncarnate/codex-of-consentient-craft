/**
 * PURPOSE: The three errors a unix domain socket raises that a caller of `unixSocketRequest` or
 * `unixSocketServe` branches on, held as data so a proxy can stage one without opening a socket —
 * a composing package's unit run traps `net`. `ENOENT` is a connect to a socket file that does not
 * exist, `ECONNREFUSED` a connect to a socket file nothing listens on, `EADDRINUSE` a listen on a
 * path another server already holds. Its test provokes each one for real and asserts this stub
 * matches it field for field. Reach for `ConnectionRefusedRecordedErrorStub` instead for a TCP
 * host and port.
 *
 * USAGE:
 * const error = UnixSocketRecordedErrorStub({ code: 'ENOENT', socketPath: '/tmp/dm-sock/a.sock' });
 * // Returns { message: 'connect ENOENT /tmp/dm-sock/a.sock', errno: -2, code: 'ENOENT',
 * //   syscall: 'connect', address: '/tmp/dm-sock/a.sock' }
 */
import { constants } from 'os';

export const UnixSocketRecordedErrorStub = ({
  code,
  socketPath,
}: {
  code: 'ENOENT' | 'ECONNREFUSED' | 'EADDRINUSE';
  socketPath: string;
}): NodeJS.ErrnoException & { address: string } => {
  const errno = -constants.errno[code];

  if (code === 'EADDRINUSE') {
    // A listen error carries `port: -1` for a pipe path, where a connect error carries no port.
    return Object.assign(new Error(`listen EADDRINUSE: address already in use ${socketPath}`), {
      code,
      errno,
      syscall: 'listen',
      address: socketPath,
      port: -1,
    });
  }

  return Object.assign(new Error(`connect ${code} ${socketPath}`), {
    errno,
    code,
    syscall: 'connect',
    address: socketPath,
  });
};

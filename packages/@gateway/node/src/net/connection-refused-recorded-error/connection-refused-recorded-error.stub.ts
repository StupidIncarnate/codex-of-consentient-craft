/**
 * PURPOSE: The ECONNREFUSED error `ConnectionRefusedErrorStub` captures, held as data so a caller
 * can stage it synchronously and without opening a socket — a composing package's unit run traps
 * `net.createConnection`, which the capturing stub needs. Its test records a real refused
 * connection and asserts this stub matches it field for field, so the shape cannot drift from what
 * Node and the OS actually raise.
 *
 * USAGE:
 * const error = ConnectionRefusedRecordedErrorStub({ port: 4000 });
 * // Returns { code: 'ECONNREFUSED', errno, syscall: 'connect', address: '127.0.0.1', port: 4000 }
 */
import { constants } from 'os';

export const ConnectionRefusedRecordedErrorStub = ({
  address = '127.0.0.1',
  port = 4000,
}: { address?: string; port?: number } = {}): NodeJS.ErrnoException & {
  address: string;
  port: number;
} =>
  Object.assign(new Error(`connect ECONNREFUSED ${address}:${port}`), {
    errno: -constants.errno.ECONNREFUSED,
    code: 'ECONNREFUSED',
    syscall: 'connect',
    address,
    port,
  });

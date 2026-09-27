/**
 * PURPOSE: An ENOTFOUND-shaped error, matching what Node's DNS resolver raises for a hostname that
 * does not resolve. Hand-built, not captured — a DNS miss needs a real DNS server to say "not
 * found" against, so unlike this folder's `ConnectionRefusedErrorStub`/`AddressInUseErrorStub`
 * siblings, it cannot be triggered offline. Built as a real Error (not a bare object) for the same
 * reason `FsErrorStub` is: it must survive `registerMock`'s `.rejects()` staging unchanged.
 *
 * USAGE:
 * const error = HostNotFoundErrorStub({ hostname: 'does-not-exist.invalid' });
 * // Returns a real Error: { code: 'ENOTFOUND', hostname, syscall: 'getaddrinfo' }
 */
import type { HostNotFoundError } from './host-not-found-error';

export const HostNotFoundErrorStub = ({
  hostname = 'does-not-exist.invalid',
}: { hostname?: string } = {}): HostNotFoundError =>
  Object.assign(new Error(`getaddrinfo ENOTFOUND ${hostname}`), {
    code: 'ENOTFOUND',
    hostname,
    syscall: 'getaddrinfo',
  });

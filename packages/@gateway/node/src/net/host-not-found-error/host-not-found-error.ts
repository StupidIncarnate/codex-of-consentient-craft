/**
 * PURPOSE: The shape `HostNotFoundErrorStub` works with, declared on its own so a caller names it
 * through `#gateway/node/net` without importing the stub. Node's own `NodeJS.ErrnoException` does
 * not declare `hostname`, even though a real DNS lookup failure carries it at runtime.
 *
 * USAGE:
 * import type { HostNotFoundError } from '#gateway/node/net';
 */
export interface HostNotFoundError extends NodeJS.ErrnoException {
  hostname: string;
}

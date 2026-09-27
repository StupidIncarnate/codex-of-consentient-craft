/**
 * PURPOSE: A real `Debugger`, minted by calling the actual `debug` package's default export — for
 * a caller staging this subpath's own value instead of hand-typing a fake function.
 *
 * USAGE:
 * const log = DebuggerStub();
 * // Returns a real Debugger for the 'gateway-stub' namespace
 */
import createDebug from 'debug';
import type { Debugger } from 'debug';

export const DebuggerStub = ({
  namespace = 'gateway-stub',
}: { namespace?: string } = {}): Debugger => createDebug(namespace);

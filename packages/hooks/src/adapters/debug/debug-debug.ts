/**
 * PURPOSE: Adapter for creating namespaced debug loggers using the debug library
 *
 * USAGE:
 * const log = debugDebug({ namespace: 'questmaestro:session-start-hook' });
 * // Returns Debugger instance for logging with the given namespace
 */
import debug, { type Debugger } from 'debug';

export type { Debugger };

export const debugDebug = ({ namespace }: { namespace: string }): Debugger => debug(namespace);

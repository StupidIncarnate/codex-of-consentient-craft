/**
 * PURPOSE: Adapter for creating namespaced debug loggers using the debug library
 *
 * USAGE:
 * const log = debugDebugAdapter({ namespace: 'questmaestro:session-start-hook' });
 * // Returns Debugger instance for logging with the given namespace
 */
import debug from 'debug';
import type { Debugger } from 'debug';

export const debugDebugAdapter = ({ namespace }: { namespace: string }): Debugger =>
  debug(namespace);

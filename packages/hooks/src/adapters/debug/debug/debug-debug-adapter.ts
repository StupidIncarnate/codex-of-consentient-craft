/**
 * PURPOSE: Adapter for creating namespaced debug loggers using the debug library
 *
 * USAGE:
 * const log = debugDebugAdapter({ namespace: 'dungeonmaster:session-start-hook' });
 * // Returns Debugger instance for logging with the given namespace
 */
import debug from '#gateway/npm/debug';
import type { Debugger } from '#gateway/npm/debug';

export const debugDebugAdapter = ({ namespace }: { namespace: string }): Debugger =>
  debug(namespace);

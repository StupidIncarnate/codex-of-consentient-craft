/**
 * PURPOSE: Curated entry for the browser global `console`. `console` is the global object itself,
 * captured for callers that write `console.error(...)`; `consoleError`, `consoleWarn`,
 * `consoleLog`, `consoleInfo` and `consoleDebug` each read their method at call time and carry a
 * proxy that records and silences it. Both forms reach the same method, so one proxy covers either.
 *
 * USAGE:
 * import { console, consoleError } from '#gateway/browser/console';
 */

export const { console } = globalThis;
export { consoleDebug } from './console-debug/console-debug';
export { consoleError } from './console-error/console-error';
export { consoleInfo } from './console-info/console-info';
export { consoleLog } from './console-log/console-log';
export { consoleWarn } from './console-warn/console-warn';

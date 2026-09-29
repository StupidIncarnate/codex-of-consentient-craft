/**
 * PURPOSE: Curated entry for the browser global `setInterval`. The wrapper reads the global at call
 * time, so fake timers and spies installed after this module loads still control it.
 *
 * USAGE:
 * import { setInterval } from '#gateway/browser/setInterval';
 */

export { setInterval } from './set-interval/set-interval';

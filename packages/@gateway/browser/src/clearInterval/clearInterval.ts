/**
 * PURPOSE: Curated entry for the browser global `clearInterval`. The wrapper reads the global at
 * call time, so fake timers and spies installed after this module loads still control it.
 *
 * USAGE:
 * import { clearInterval } from '#gateway/browser/clearInterval';
 */

export { clearInterval } from './clear-interval/clear-interval';

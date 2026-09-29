/**
 * PURPOSE: Curated entry for the browser global `clearTimeout`. The wrapper reads the global at
 * call time, so fake timers and spies installed after this module loads still control it.
 *
 * USAGE:
 * import { clearTimeout } from '#gateway/browser/clearTimeout';
 */

export { clearTimeout } from './clear-timeout/clear-timeout';

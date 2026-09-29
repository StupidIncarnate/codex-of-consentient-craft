/**
 * PURPOSE: Curated entry for the browser global `setTimeout`. The wrapper reads the global at call
 * time, so fake timers and spies installed after this module loads still control it.
 *
 * USAGE:
 * import { setTimeout } from '#gateway/browser/setTimeout';
 */

export { setTimeout } from './set-timeout/set-timeout';

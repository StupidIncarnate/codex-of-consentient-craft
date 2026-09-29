/**
 * PURPOSE: Curated entry for the browser global `requestAnimationFrame`. The wrapper reads the
 * global at call time, so a spy or fake timer installed after this module loads still controls it.
 *
 * USAGE:
 * import { requestAnimationFrame } from '#gateway/browser/requestAnimationFrame';
 */

export { requestAnimationFrame } from './request-animation-frame/request-animation-frame';

/**
 * PURPOSE: Curated entry for the browser global `createImageBitmap`. The wrapper reads the global at
 * call time, so a harness that installs one after this module loads is seen.
 *
 * USAGE:
 * import { createImageBitmap } from '#gateway/browser/createImageBitmap';
 */

export { createImageBitmap } from './create-image-bitmap/create-image-bitmap';

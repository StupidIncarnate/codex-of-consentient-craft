/// <reference lib="dom" />
/**
 * PURPOSE: Decodes an image source into an `ImageBitmap` through the browser global
 * `createImageBitmap`. The global is read at CALL time, not destructured at module load: jsdom has
 * no `createImageBitmap` at all, so a load-time copy is `undefined` for the life of the module and
 * a harness that installs one later is never seen.
 *
 * USAGE:
 * const bitmap = await createImageBitmap(new Blob([bytes]));
 * // Returns an ImageBitmap; the caller owns it and closes it
 */

export const createImageBitmap = async (image: ImageBitmapSource): Promise<ImageBitmap> =>
  globalThis.createImageBitmap(image);

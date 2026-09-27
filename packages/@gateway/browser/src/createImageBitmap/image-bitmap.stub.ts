/**
 * PURPOSE: A complete `ImageBitmap`-shaped value, typed against the real DOM interface. jsdom (this
 * package's test environment) implements no Canvas/ImageBitmap API at all — `globalThis.createImageBitmap`
 * itself is `undefined` here, confirmed by this subpath's own barrel test — and `ImageBitmap` has no
 * public constructor even in a real browser (only `createImageBitmap()` or
 * `transferToImageBitmap()` produce one), so hand-building by hand is the only way to stage its
 * shape at all.
 *
 * USAGE:
 * const bitmap = ImageBitmapStub({ width: 32, height: 16 });
 */

export const ImageBitmapStub = ({
  width = 32,
  height = 16,
}: { width?: number; height?: number } = {}): ImageBitmap => ({
  width,
  height,
  close: (): void => undefined,
});

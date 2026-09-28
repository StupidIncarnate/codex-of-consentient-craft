/// <reference lib="dom" />
/**
 * PURPOSE: Draws a decoded bitmap onto a fresh canvas of exactly the given size and encodes it as a
 * data URL. Choosing the size, and closing the bitmap, stay the caller's job; this only owns the
 * canvas. Throws, naming the missing piece, when the browser hands back no 2D context.
 *
 * USAGE:
 * const dataUrl = canvasEncode({
 *   image: bitmap,
 *   widthPx: 2000,
 *   heightPx: 1333,
 *   mediaType: 'image/jpeg',
 *   quality: 0.82,
 * });
 * // Returns the canvas's `toDataURL(mediaType, quality)` output
 */

export const canvasEncode = ({
  image,
  widthPx,
  heightPx,
  mediaType,
  quality,
}: {
  image: ImageBitmap;
  widthPx: number;
  heightPx: number;
  mediaType: string;
  quality: number;
}): string => {
  const canvas = globalThis.document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('canvasEncode: 2d canvas context unavailable');
  }

  context.drawImage(image, 0, 0, widthPx, heightPx);

  return canvas.toDataURL(mediaType, quality);
};

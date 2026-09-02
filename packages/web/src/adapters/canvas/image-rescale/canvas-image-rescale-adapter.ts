/**
 * PURPOSE: The only place this package touches a `<canvas>` 2D context to re-encode a pasted image
 * at a caller-chosen size. It draws at whatever `size` it is handed rather than computing one
 * itself, because the downscale ladder that picks that size lives in
 * `transformers/downscale-target` — jsdom has no canvas, so anything drawn or encoded inside this
 * adapter is only ever exercised through mocked `getContext`/`toDataURL` calls, and a cap proven
 * against those mocks proves nothing about a real browser.
 *
 * USAGE:
 * const shrunk = await canvasImageRescaleAdapter({
 *   dataUrl: pastedDataUrl,
 *   size: { widthPx: 2000, heightPx: 1333 },
 *   mediaType: 'image/jpeg',
 *   quality: 0.82,
 * });
 * // Returns: ImageDataUrl — the image re-encoded at exactly `size`
 */

import type { PastedImageMediaType } from '@dungeonmaster/shared/contracts';

import { imageDataUrlContract } from '../../../contracts/image-data-url/image-data-url-contract';
import type { ImageDataUrl } from '../../../contracts/image-data-url/image-data-url-contract';
import type { ImageSize } from '../../../contracts/image-size/image-size-contract';

const BASE64_MARKER = ';base64,';

export const canvasImageRescaleAdapter = async ({
  dataUrl,
  size,
  mediaType,
  quality,
}: {
  dataUrl: ImageDataUrl;
  size: ImageSize;
  mediaType: PastedImageMediaType;
  quality: number;
}): Promise<ImageDataUrl> => {
  const markerIndex = dataUrl.indexOf(BASE64_MARKER);
  const base64 = dataUrl.slice(markerIndex + BASE64_MARKER.length);
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes]);
  const bitmap = await globalThis.createImageBitmap(blob);

  const canvas = document.createElement('canvas');
  canvas.width = size.widthPx;
  canvas.height = size.heightPx;

  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close();
    throw new Error('canvasImageRescaleAdapter: 2d canvas context unavailable');
  }

  context.drawImage(bitmap, 0, 0, size.widthPx, size.heightPx);
  bitmap.close();

  const encoded = canvas.toDataURL(mediaType, quality);

  return imageDataUrlContract.parse(encoded);
};

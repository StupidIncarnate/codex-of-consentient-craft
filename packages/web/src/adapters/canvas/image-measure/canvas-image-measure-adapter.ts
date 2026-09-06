/**
 * PURPOSE: The only place this package touches `createImageBitmap` to learn a pasted image's real
 * pixel dimensions before any resize math runs. The downscale ladder that decides whether and how
 * far to shrink lives in `transformers/downscale-target` rather than here, because jsdom has no
 * canvas — anything measured inside this adapter is only ever exercised through a mocked
 * `createImageBitmap`, and a cap proven against a mock proves nothing about a real image.
 *
 * USAGE:
 * const size = await canvasImageMeasureAdapter({ dataUrl: pastedDataUrl });
 * // Returns: ImageSize — { widthPx, heightPx } read off the decoded bitmap
 */

import { imageSizeContract } from '../../../contracts/image-size/image-size-contract';
import type { ImageSize } from '../../../contracts/image-size/image-size-contract';
import type { ImageDataUrl } from '../../../contracts/image-data-url/image-data-url-contract';

const BASE64_MARKER = ';base64,';

export const canvasImageMeasureAdapter = async ({
  dataUrl,
}: {
  dataUrl: ImageDataUrl;
}): Promise<ImageSize> => {
  const markerIndex = dataUrl.indexOf(BASE64_MARKER);
  const base64 = dataUrl.slice(markerIndex + BASE64_MARKER.length);
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes]);
  const bitmap = await globalThis.createImageBitmap(blob);
  const { width, height } = bitmap;

  bitmap.close();

  return imageSizeContract.parse({ widthPx: width, heightPx: height });
};

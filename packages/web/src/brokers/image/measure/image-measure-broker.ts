/**
 * PURPOSE: Learns a pasted image's real pixel dimensions from its data URL before any resize math
 * runs. The downscale ladder that decides whether and how far to shrink lives in
 * `transformers/downscale-target` rather than here, because jsdom has no canvas — anything measured
 * in this broker is only ever exercised through a staged `createImageBitmap`, and a cap proven
 * against a stage proves nothing about a real image.
 *
 * USAGE:
 * const size = await imageMeasureBroker({ dataUrl: pastedDataUrl });
 * // Returns: ImageSize — { widthPx, heightPx } read off the decoded bitmap
 */

import { atob } from '#gateway/browser/atob';
import { Blob } from '#gateway/browser/Blob';
import { createImageBitmap } from '#gateway/browser/createImageBitmap';

import { imageSizeContract } from '../../../contracts/image-size/image-size-contract';
import type { ImageSize } from '../../../contracts/image-size/image-size-contract';
import type { ImageDataUrl } from '../../../contracts/image-data-url/image-data-url-contract';

const BASE64_MARKER = ';base64,';

export const imageMeasureBroker = async ({
  dataUrl,
}: {
  dataUrl: ImageDataUrl;
}): Promise<ImageSize> => {
  const markerIndex = dataUrl.indexOf(BASE64_MARKER);
  const base64 = dataUrl.slice(markerIndex + BASE64_MARKER.length);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const bitmap = await createImageBitmap(new Blob([bytes]));
  const { width, height } = bitmap;

  bitmap.close();

  return imageSizeContract.parse({ widthPx: width, heightPx: height });
};

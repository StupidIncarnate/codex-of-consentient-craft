/**
 * PURPOSE: Re-encodes a pasted image at a caller-chosen size. It draws at whatever `size` it is
 * handed rather than computing one itself, because the downscale ladder that picks that size lives
 * in `transformers/downscale-target` — jsdom has no canvas, so the encode is only ever exercised
 * through a staged `canvasEncode`, and a cap proven against that stage proves nothing about a real
 * browser.
 *
 * USAGE:
 * const shrunk = await imageRescaleBroker({
 *   dataUrl: pastedDataUrl,
 *   size: { widthPx: 2000, heightPx: 1333 },
 *   mediaType: 'image/jpeg',
 *   quality: 0.82,
 * });
 * // Returns: ImageDataUrl — the image re-encoded at exactly `size`
 */

import type { PastedImageMediaType } from '@dungeonmaster/shared/contracts';

import { atob } from '#gateway/browser/atob';
import { Blob } from '#gateway/browser/Blob';
import { createImageBitmap } from '#gateway/browser/createImageBitmap';
import { canvasEncode } from '#gateway/browser/HTMLCanvasElement';

import { imageDataUrlContract } from '../../../contracts/image-data-url/image-data-url-contract';
import type { ImageDataUrl } from '../../../contracts/image-data-url/image-data-url-contract';
import type { ImageSize } from '../../../contracts/image-size/image-size-contract';

const BASE64_MARKER = ';base64,';

export const imageRescaleBroker = async ({
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
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const bitmap = await createImageBitmap(new Blob([bytes]));

  try {
    const encoded = canvasEncode({
      image: bitmap,
      widthPx: size.widthPx,
      heightPx: size.heightPx,
      mediaType,
      quality,
    });

    return imageDataUrlContract.parse(encoded);
  } finally {
    bitmap.close();
  }
};

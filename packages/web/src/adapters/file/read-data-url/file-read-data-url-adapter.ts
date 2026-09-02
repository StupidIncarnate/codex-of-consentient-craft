/**
 * PURPOSE: Converts a clipboard-pasted image Blob into the base64 data URL the composer holds from
 * the instant of paste — a thumbnail renders straight from that string before any server has a copy
 * of the image, and it is the same string the IndexedDB draft record is later split out of.
 *
 * USAGE:
 * const dataUrl = await fileReadDataUrlAdapter({ blob: pastedImageBlob });
 * // Returns: ImageDataUrl branded string
 */

import { imageDataUrlContract } from '../../../contracts/image-data-url/image-data-url-contract';
import type { ImageDataUrl } from '../../../contracts/image-data-url/image-data-url-contract';

export const fileReadDataUrlAdapter = async ({ blob }: { blob: Blob }): Promise<ImageDataUrl> => {
  const result = await new Promise<FileReader['result']>((resolve, reject) => {
    const reader = new globalThis.FileReader();

    reader.onload = (): void => {
      resolve(reader.result);
    };

    reader.onerror = (): void => {
      reject(
        new Error(
          `fileReadDataUrlAdapter: failed to read blob — ${reader.error?.message ?? 'unknown error'}`,
        ),
      );
    };

    reader.readAsDataURL(blob);
  });

  // reader.result is typed string | ArrayBuffer | null because FileReader is shared across
  // readAsDataURL/readAsArrayBuffer/readAsText — readAsDataURL always yields a string on success,
  // but the type doesn't know that, so a non-string result is a real branch, not a formality.
  if (typeof result !== 'string') {
    throw new Error('fileReadDataUrlAdapter: reader produced a non-string result');
  }

  // Deliberate: this is what refuses a clipboard blob whose media type is not one of the four
  // allowed ones, at the moment the bytes are read, rather than letting an unsupported type travel
  // further into the composer.
  return imageDataUrlContract.parse(result);
};

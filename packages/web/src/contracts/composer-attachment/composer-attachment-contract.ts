/**
 * PURPOSE: One pasted image as it sits in the chat composer, before any server has a copy of it.
 * Reach for this over the shared pastedImageUpload contract when the value never leaves the
 * browser and needs the render-time fields (dataUrl, pixel size) a request body has no use for.
 *
 * USAGE:
 * composerAttachmentContract.parse({
 *   attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   mediaType: 'image/png',
 *   dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
 *   byteLength: 1024,
 *   widthPx: 2000,
 *   heightPx: 1333,
 * });
 * // Returns: ComposerAttachment
 */

import { z } from 'zod';

import { pastedImageMediaTypeContract } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { attachmentIdContract } from '../attachment-id/attachment-id-contract';
import { byteLengthContract } from '../byte-length/byte-length-contract';
import { imageDataUrlContract } from '../image-data-url/image-data-url-contract';
import { pixelLengthContract } from '../pixel-length/pixel-length-contract';

export const composerAttachmentContract = z.object({
  attachmentId: attachmentIdContract,
  // The type AFTER the downscale ladder has run, which is not always the type that was pasted: a
  // PNG that failed the byte ceiling comes back re-encoded as image/jpeg.
  mediaType: pastedImageMediaTypeContract,
  dataUrl: imageDataUrlContract,
  // The decoded size after downscaling; feeds the per-message byte total.
  byteLength: byteLengthContract.refine((value) => value <= pastedImageStatics.maxBytesPerImage, {
    message: `Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes`,
  }),
  // The pixel size after downscaling.
  widthPx: pixelLengthContract,
  heightPx: pixelLengthContract,
});

export type ComposerAttachment = z.infer<typeof composerAttachmentContract>;

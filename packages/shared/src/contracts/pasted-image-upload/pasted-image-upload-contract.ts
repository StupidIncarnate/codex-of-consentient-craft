/**
 * PURPOSE: Shape of one pasted image as it rides inside the chat JSON request body, distinct from
 * imageBlockParamContract (the Anthropic SDK content-block shape sent onward to Claude) because this
 * one is the boundary the server validates an untrusted browser payload against — the byte ceiling
 * here is what still applies when a request skips the browser's own downscale ladder.
 *
 * USAGE:
 * pastedImageUploadContract.parse({ mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' });
 * // Returns: PastedImageUpload with branded mediaType and dataBase64 fields
 */
import { z } from 'zod';

import { pastedImageStatics } from '../../statics/pasted-image/pasted-image-statics';
import { pastedImageMediaTypeContract } from '../pasted-image-media-type/pasted-image-media-type-contract';

const BASE64_BYTES_PER_GROUP = 3;
const BASE64_CHARS_PER_GROUP = 4;

const base64ImageDataContract = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/u)
  .refine(
    (value) =>
      Math.floor(
        (value.replace(/[=]+$/u, '').length * BASE64_BYTES_PER_GROUP) / BASE64_CHARS_PER_GROUP,
      ) <= pastedImageStatics.maxBytesPerImage,
    { message: `Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes` },
  )
  .brand<'Base64ImageData'>();

export type Base64ImageData = z.infer<typeof base64ImageDataContract>;

export const pastedImageUploadContract = z.object({
  mediaType: pastedImageMediaTypeContract,
  dataBase64: base64ImageDataContract,
});

export type PastedImageUpload = z.infer<typeof pastedImageUploadContract>;

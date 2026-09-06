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
const BASE64_CHUNK_PATTERN = /^[A-Za-z0-9+/]*$/u;
const DOUBLE_PADDING = '==';
const SINGLE_PADDING = '=';
const TRIPLE_PADDING = '===';
// A single regex spanning the whole payload hands V8's unicode-mode engine a multi-megabyte
// string to match a `+` quantifier over — a plausible size for a pasted screenshot before the
// browser's downscale ladder runs, and one that has crashed with "Maximum call stack size
// exceeded" under real load. Chunking keeps every regex.test() call bounded to this many
// characters regardless of payload size.
const BASE64_CHUNK_SIZE = 65536;

const base64ImageDataContract = z
  .string()
  .min(1)
  .superRefine((value, ctx) => {
    let strippedLength = value.length;
    if (value.endsWith(DOUBLE_PADDING)) {
      strippedLength = value.length - DOUBLE_PADDING.length;
    } else if (value.endsWith(SINGLE_PADDING)) {
      strippedLength = value.length - SINGLE_PADDING.length;
    }

    const body = value.slice(0, strippedLength);

    const isValidCharset = (() => {
      if (value.endsWith(TRIPLE_PADDING) || body.length === 0) {
        return false;
      }

      for (let start = 0; start < body.length; start += BASE64_CHUNK_SIZE) {
        if (!BASE64_CHUNK_PATTERN.test(body.slice(start, start + BASE64_CHUNK_SIZE))) {
          return false;
        }
      }

      return true;
    })();

    if (!isValidCharset) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_string,
        validation: 'regex',
        message: 'Invalid base64 image data',
      });
      return;
    }

    const decodedBytes = Math.floor(
      (strippedLength * BASE64_BYTES_PER_GROUP) / BASE64_CHARS_PER_GROUP,
    );

    if (decodedBytes > pastedImageStatics.maxBytesPerImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes`,
      });
    }
  })
  .brand<'Base64ImageData'>();

export type Base64ImageData = z.infer<typeof base64ImageDataContract>;

export const pastedImageUploadContract = z.object({
  mediaType: pastedImageMediaTypeContract,
  dataBase64: base64ImageDataContract,
});

export type PastedImageUpload = z.infer<typeof pastedImageUploadContract>;

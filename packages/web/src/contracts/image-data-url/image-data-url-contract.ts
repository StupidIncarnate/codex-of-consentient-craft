/**
 * PURPOSE: What a thumbnail and the optimistic message bubble render from before the server has
 * any copy of the image. Reach for this over the shared pastedImageUpload contract when the value
 * is going into an `img` src rather than into a request body.
 *
 * USAGE:
 * imageDataUrlContract.parse('data:image/png;base64,iVBORw0KGgo=');
 * // Returns: ImageDataUrl branded string
 */

import { z } from 'zod';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

const MEDIA_TYPE_ALTERNATION = pastedImageStatics.allowedMediaTypes
  .map((mediaType) => mediaType.replace('/', '\\/'))
  .join('|');

const BASE64_MARKER = ';base64,';
const PREFIX_PATTERN = new RegExp(`^data:(?:${MEDIA_TYPE_ALTERNATION})${BASE64_MARKER}`, 'u');
const BASE64_CHUNK_PATTERN = /^[A-Za-z0-9+/]*$/u;
const DOUBLE_PADDING = '==';
const SINGLE_PADDING = '=';
const TRIPLE_PADDING = '===';
// A single regex spanning the whole base64 payload hands V8's unicode-mode engine a
// multi-megabyte string to match a `+` quantifier over — a plausible size for a pasted
// screenshot before the downscale ladder runs, and one that has crashed with
// "Maximum call stack size exceeded" under real load. Chunking keeps every regex.test()
// call bounded to this many characters regardless of payload size.
const BASE64_CHUNK_SIZE = 65536;

export const imageDataUrlContract = z
  .string()
  .superRefine((value, ctx) => {
    const prefixMatch = PREFIX_PATTERN.exec(value);

    const isValid = (() => {
      if (!prefixMatch) {
        return false;
      }

      const payload = value.slice(prefixMatch[0].length);

      if (payload.endsWith(TRIPLE_PADDING)) {
        return false;
      }

      let body = payload;
      if (payload.endsWith(DOUBLE_PADDING)) {
        body = payload.slice(0, payload.length - DOUBLE_PADDING.length);
      } else if (payload.endsWith(SINGLE_PADDING)) {
        body = payload.slice(0, payload.length - SINGLE_PADDING.length);
      }

      if (body.length === 0) {
        return false;
      }

      for (let start = 0; start < body.length; start += BASE64_CHUNK_SIZE) {
        if (!BASE64_CHUNK_PATTERN.test(body.slice(start, start + BASE64_CHUNK_SIZE))) {
          return false;
        }
      }

      return true;
    })();

    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_string,
        validation: 'regex',
        message: 'Invalid image data URL',
      });
    }
  })
  .brand<'ImageDataUrl'>();

export type ImageDataUrl = z.infer<typeof imageDataUrlContract>;

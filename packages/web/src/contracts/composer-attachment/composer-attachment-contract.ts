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

import { z } from '#gateway/npm/zod';

import { pastedImageMediaTypeContract } from '@dungeonmaster/shared/contracts';
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
// Chunked: one regex over a multi-megabyte payload has crashed V8's unicode-mode engine with
// "Maximum call stack size exceeded", so every regex.test() call stays bounded to this size.
const BASE64_CHUNK_SIZE = 65536;

export const composerAttachmentContract = z.object({
  attachmentId: z.uuid().brand<'ComposerAttachmentAttachmentId'>(),
  // The type AFTER the downscale ladder has run, which is not always the type that was pasted: a
  // PNG that failed the byte ceiling comes back re-encoded as image/jpeg.
  mediaType: pastedImageMediaTypeContract,
  dataUrl: z
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
        // `custom`: zod v4 reports string-format issues as `invalid_format`, and this check is hand-rolled.
        ctx.addIssue({ code: 'custom', message: 'Invalid image data URL' });
      }
    })
    .brand<'ComposerAttachmentDataUrl'>(),
  // The decoded size after downscaling; feeds the per-message byte total.
  byteLength: z.number().int().nonnegative().brand<'ComposerAttachmentByteLength'>().refine((value) => value <= pastedImageStatics.maxBytesPerImage, {
    message: `Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes`,
  }),
  // The pixel size after downscaling.
  widthPx: z.number().int().positive().brand<'ComposerAttachmentWidthPx'>(),
  heightPx: z.number().int().positive().brand<'ComposerAttachmentHeightPx'>(),
}).brand<'ComposerAttachment'>();

export type ComposerAttachment = z.infer<typeof composerAttachmentContract>;

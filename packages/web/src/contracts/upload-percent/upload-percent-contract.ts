/**
 * PURPOSE: Bounds the composer's upload-progress indicator to a 0..100 whole number. Reach for this
 * over byteLengthContract when the value being carried is a fraction of a known total meant for
 * display, not a raw byte count with no ceiling.
 *
 * USAGE:
 * uploadPercentContract.parse(42);
 * // Returns: UploadPercent branded number
 */

import { z } from 'zod';

import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';

export const uploadPercentContract = z
  .number()
  .int()
  .min(chatComposerStatics.upload.minPercent)
  .max(chatComposerStatics.upload.maxPercent)
  .brand<'UploadPercent'>();

export type UploadPercent = z.infer<typeof uploadPercentContract>;

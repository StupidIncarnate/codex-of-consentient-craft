/**
 * PURPOSE: Reach for this over composerAttachmentContract when the only thing in hand is a
 * width/height pair — a canvas measurement or a downscale target — with no bytes and no id yet to
 * hang it on.
 *
 * USAGE:
 * imageSizeContract.parse({ widthPx: 2000, heightPx: 1333 });
 * // Returns: ImageSize — a widthPx/heightPx pair
 */

import { z } from '#gateway/npm/zod';

export const imageSizeContract = z
  .object({
    widthPx: z.number().int().positive().brand<'ImageSizeWidthPx'>(),
    heightPx: z.number().int().positive().brand<'ImageSizeHeightPx'>(),
  })
  .brand<'ImageSize'>();

export type ImageSize = z.infer<typeof imageSizeContract>;

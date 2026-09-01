/**
 * PURPOSE: One enum the browser's paste-time check and the server's body validation both parse
 * through, so a MIME type accepted by one side is never silently rejected by the other.
 *
 * USAGE:
 * pastedImageMediaTypeContract.parse('image/png');
 * // Returns branded PastedImageMediaType
 */
import { z } from 'zod';

import { pastedImageStatics } from '../../statics/pasted-image/pasted-image-statics';

export const pastedImageMediaTypeContract = z
  .enum(pastedImageStatics.allowedMediaTypes)
  .brand<'PastedImageMediaType'>();

export type PastedImageMediaType = z.infer<typeof pastedImageMediaTypeContract>;

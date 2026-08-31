/**
 * PURPOSE: Reach for this over the inline `media_type` brand inside image-block-param-contract.ts
 * when validating a paste, not a wire call to the SDK — the browser's clipboard-paste check and the
 * server's request-body validation both parse a pasted image's MIME type through this one enum so
 * neither side can drift from the other.
 *
 * USAGE:
 * pastedImageMediaTypeContract.parse('image/png');
 * // Returns: 'image/png' as PastedImageMediaType
 */

import { z } from 'zod';

import { pastedImageStatics } from '../../statics/pasted-image/pasted-image-statics';

export const pastedImageMediaTypeContract = z
  .enum(pastedImageStatics.allowedMediaTypes)
  .brand<'PastedImageMediaType'>();

export type PastedImageMediaType = z.infer<typeof pastedImageMediaTypeContract>;

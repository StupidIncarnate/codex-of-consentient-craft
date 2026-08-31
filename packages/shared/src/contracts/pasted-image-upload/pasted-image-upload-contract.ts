/**
 * PURPOSE: One message's chat request carries an ordered array of these beside its text — images
 * ride in the same JSON body as the message rather than a separate upload step, so nothing branches
 * on whether a quest already exists yet. Reach for imageBlockParamContract instead when the shape is
 * headed to the Anthropic SDK; this one is for a browser-to-server paste upload.
 *
 * USAGE:
 * pastedImageUploadContract.parse({ mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' });
 * // Returns: PastedImageUpload
 */

import { z } from 'zod';

import { pastedImageMediaTypeContract } from '../pasted-image-media-type/pasted-image-media-type-contract';

export const pastedImageUploadContract = z.object({
  mediaType: pastedImageMediaTypeContract,
  dataBase64: z.string().min(1).brand<'Base64ImageData'>(),
});

export type PastedImageUpload = z.infer<typeof pastedImageUploadContract>;

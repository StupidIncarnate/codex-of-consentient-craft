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

export const imageDataUrlContract = z
  .string()
  .regex(new RegExp(`^data:(?:${MEDIA_TYPE_ALTERNATION});base64,[A-Za-z0-9+/]+={0,2}$`, 'u'))
  .brand<'ImageDataUrl'>();

export type ImageDataUrl = z.infer<typeof imageDataUrlContract>;

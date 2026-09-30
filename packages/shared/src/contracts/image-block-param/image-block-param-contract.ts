/**
 * PURPOSE: Defines the Anthropic SDK ImageBlockParam shape with base64 and URL source variants
 *
 * USAGE:
 * imageBlockParamContract.parse({ type: 'image', source: { type: 'url', url: 'https://example.com/img.png' } });
 * // Returns: ImageBlockParam with discriminated source union
 */

import { z } from '#gateway/npm/zod';

const base64ImageSourceContract = z
  .object({
    type: z.literal('base64'),
    media_type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    data: z.string().brand<'Base64ImageSourceData'>(),
  })
  .brand<'Base64ImageSource'>();

const urlImageSourceContract = z
  .object({
    type: z.literal('url'),
    url: z.string().brand<'UrlImageSourceUrl'>(),
  })
  .brand<'UrlImageSource'>();

export const imageBlockParamContract = z
  .object({
    type: z.literal('image'),
    source: z.discriminatedUnion('type', [base64ImageSourceContract, urlImageSourceContract]),
  })
  .brand<'ImageBlockParam'>();

export type ImageBlockParam = z.infer<typeof imageBlockParamContract>;

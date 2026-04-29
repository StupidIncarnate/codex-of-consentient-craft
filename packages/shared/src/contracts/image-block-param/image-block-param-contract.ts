/**
 * PURPOSE: Defines the Anthropic SDK ImageBlockParam shape with base64 and URL source variants
 *
 * USAGE:
 * imageBlockParamContract.parse({ type: 'image', source: { type: 'url', url: 'https://example.com/img.png' } });
 * // Returns: ImageBlockParam with discriminated source union
 */

import { z } from 'zod';

const base64ImageSourceContract = z.object({
  type: z.literal('base64'),
  media_type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']).brand<'MediaType'>(),
  data: z.string().brand<'Base64Data'>(),
});

const urlImageSourceContract = z.object({
  type: z.literal('url'),
  url: z.string().brand<'ImageUrl'>(),
});

export const imageBlockParamContract = z.object({
  type: z.literal('image'),
  source: z.discriminatedUnion('type', [base64ImageSourceContract, urlImageSourceContract]),
});

export type ImageBlockParam = z.infer<typeof imageBlockParamContract>;

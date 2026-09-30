/**
 * PURPOSE: Defines the Anthropic SDK SearchResultBlockParam shape for web search result content blocks
 *
 * USAGE:
 * searchResultBlockParamContract.parse({ type: 'search_result', source: 'https://example.com', title: 'Example', content: [] });
 * // Returns: SearchResultBlockParam
 */

import { z } from '#gateway/npm/zod';

import { textBlockParamContract } from '../text-block-param/text-block-param-contract';

export const searchResultBlockParamContract = z
  .object({
    type: z.literal('search_result'),
    source: z.string().brand<'SearchResultBlockParamSource'>(),
    title: z.string().brand<'SearchResultBlockParamTitle'>(),
    content: z.array(textBlockParamContract),
  })
  .brand<'SearchResultBlockParam'>();

export type SearchResultBlockParam = z.infer<typeof searchResultBlockParamContract>;

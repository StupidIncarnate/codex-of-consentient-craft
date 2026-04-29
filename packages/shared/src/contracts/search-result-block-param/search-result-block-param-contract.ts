/**
 * PURPOSE: Defines the Anthropic SDK SearchResultBlockParam shape for web search result content blocks
 *
 * USAGE:
 * searchResultBlockParamContract.parse({ type: 'search_result', source: 'https://example.com', title: 'Example', content: [] });
 * // Returns: SearchResultBlockParam
 */

import { z } from 'zod';

import { textBlockParamContract } from '../text-block-param/text-block-param-contract';

export const searchResultBlockParamContract = z.object({
  type: z.literal('search_result'),
  source: z.string().brand<'SearchResultSource'>(),
  title: z.string().brand<'SearchResultTitle'>(),
  content: z.array(textBlockParamContract),
});

export type SearchResultBlockParam = z.infer<typeof searchResultBlockParamContract>;

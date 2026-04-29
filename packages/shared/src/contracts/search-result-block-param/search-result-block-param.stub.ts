import type { StubArgument } from '@dungeonmaster/shared/@types';

import { searchResultBlockParamContract } from './search-result-block-param-contract';
import type { SearchResultBlockParam } from './search-result-block-param-contract';

/**
 * Web search result block — emitted when Claude's tool use includes a search result
 * with a source URL, title, and extracted text content.
 */
export const SearchResultBlockParamStub = ({
  ...props
}: StubArgument<SearchResultBlockParam> = {}): SearchResultBlockParam =>
  searchResultBlockParamContract.parse({
    type: 'search_result',
    source: 'https://example.com/article',
    title: 'Example Article Title',
    content: [{ type: 'text', text: 'The article content goes here.' }],
    ...props,
  });

/**
 * PURPOSE: Defines the discriminated union of block types valid as array elements in tool_result content
 *
 * USAGE:
 * toolResultContentBlockParamContract.parse({ type: 'text', text: 'result text' });
 * // Returns: one of TextBlockParam | ImageBlockParam | SearchResultBlockParam | DocumentBlockParam | ToolReferenceBlockParam
 */

import { z } from 'zod';

import { textBlockParamContract } from '../text-block-param/text-block-param-contract';
import { imageBlockParamContract } from '../image-block-param/image-block-param-contract';
import { searchResultBlockParamContract } from '../search-result-block-param/search-result-block-param-contract';
import { documentBlockParamContract } from '../document-block-param/document-block-param-contract';
import { toolReferenceBlockParamContract } from '../tool-reference-block-param/tool-reference-block-param-contract';

export const toolResultContentBlockParamContract = z.discriminatedUnion('type', [
  textBlockParamContract,
  imageBlockParamContract,
  searchResultBlockParamContract,
  documentBlockParamContract,
  toolReferenceBlockParamContract,
]);

export type ToolResultContentBlockParam = z.infer<typeof toolResultContentBlockParamContract>;

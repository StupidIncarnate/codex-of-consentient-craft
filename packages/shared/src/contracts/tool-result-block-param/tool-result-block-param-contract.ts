/**
 * PURPOSE: Defines the Anthropic SDK ToolResultBlockParam shape for user messages returning tool output
 *
 * USAGE:
 * toolResultBlockParamContract.parse({ type: 'tool_result', tool_use_id: 'toolu_01...', content: 'result text' });
 * // Returns: ToolResultBlockParam with optional content and is_error flag
 */

import { z } from 'zod';

import { textBlockParamContract } from '../text-block-param/text-block-param-contract';
import { imageBlockParamContract } from '../image-block-param/image-block-param-contract';
import { searchResultBlockParamContract } from '../search-result-block-param/search-result-block-param-contract';
import { documentBlockParamContract } from '../document-block-param/document-block-param-contract';
import { toolReferenceBlockParamContract } from '../tool-reference-block-param/tool-reference-block-param-contract';

export const toolResultBlockParamContract = z.object({
  type: z.literal('tool_result'),
  tool_use_id: z.string().min(1).brand<'ToolUseId'>(),
  content: z
    .union([
      z.string().brand<'ToolResultContent'>(),
      z.array(
        z.discriminatedUnion('type', [
          textBlockParamContract,
          imageBlockParamContract,
          searchResultBlockParamContract,
          documentBlockParamContract,
          toolReferenceBlockParamContract,
        ]),
      ),
    ])
    .optional(),
  is_error: z.boolean().optional(),
});

export type ToolResultBlockParam = z.infer<typeof toolResultBlockParamContract>;

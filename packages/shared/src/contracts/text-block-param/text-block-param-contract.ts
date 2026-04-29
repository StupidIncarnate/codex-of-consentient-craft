/**
 * PURPOSE: Defines the Anthropic SDK TextBlockParam shape for assistant message content
 *
 * USAGE:
 * textBlockParamContract.parse({ type: 'text', text: 'Hello world' });
 * // Returns: TextBlockParam with branded text field
 */

import { z } from 'zod';

export const textBlockParamContract = z.object({
  type: z.literal('text'),
  text: z.string().brand<'TextContent'>(),
});

export type TextBlockParam = z.infer<typeof textBlockParamContract>;

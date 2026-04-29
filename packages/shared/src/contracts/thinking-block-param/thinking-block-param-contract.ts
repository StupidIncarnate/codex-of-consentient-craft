/**
 * PURPOSE: Defines the Anthropic SDK ThinkingBlockParam shape for extended thinking content blocks
 *
 * USAGE:
 * thinkingBlockParamContract.parse({ type: 'thinking', thinking: 'Let me reason through this...' });
 * // Returns: ThinkingBlockParam with branded thinking field
 */

import { z } from 'zod';

export const thinkingBlockParamContract = z.object({
  type: z.literal('thinking'),
  thinking: z.string().brand<'ThinkingContent'>(),
  signature: z.string().brand<'ThinkingSignature'>().optional(),
});

export type ThinkingBlockParam = z.infer<typeof thinkingBlockParamContract>;

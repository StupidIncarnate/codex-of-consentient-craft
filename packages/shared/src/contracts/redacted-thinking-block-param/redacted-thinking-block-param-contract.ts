/**
 * PURPOSE: Defines the Anthropic SDK RedactedThinkingBlockParam shape for redacted thinking content
 *
 * USAGE:
 * redactedThinkingBlockParamContract.parse({ type: 'redacted_thinking', data: '<encrypted blob>' });
 * // Returns: RedactedThinkingBlockParam
 */

import { z } from 'zod';

export const redactedThinkingBlockParamContract = z.object({
  type: z.literal('redacted_thinking'),
  data: z.string().brand<'RedactedThinkingData'>(),
});

export type RedactedThinkingBlockParam = z.infer<typeof redactedThinkingBlockParamContract>;

/**
 * PURPOSE: Validates the shape of a JSONL stream line where a user message carries tool_result content items
 *
 * USAGE:
 * const parsed = userToolResultStreamLineContract.parse(JSON.parse(rawLine));
 * // Validates user messages containing tool results (permission errors, successful outputs, etc.)
 */
import { z } from 'zod';

import { toolResultBlockParamContract } from '../tool-result-block-param/tool-result-block-param-contract';
import { textBlockParamContract } from '../text-block-param/text-block-param-contract';

export const userToolResultStreamLineContract = z.object({
  type: z.literal('user'),
  message: z.object({
    role: z.literal('user'),
    content: z.array(
      z.discriminatedUnion('type', [toolResultBlockParamContract, textBlockParamContract]),
    ),
  }),
  toolUseResult: z
    .object({
      agentId: z.string().brand<'AgentIdCorrelation'>().optional(),
    })
    .optional(),
});

export type UserToolResultStreamLine = z.infer<typeof userToolResultStreamLineContract>;

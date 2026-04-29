/**
 * PURPOSE: Defines the discriminated union of block types valid inside an assistant message content array
 *
 * USAGE:
 * assistantContentBlockParamContract.parse({ type: 'text', text: 'Hello' });
 * // Returns: one of TextBlockParam | ThinkingBlockParam | RedactedThinkingBlockParam | ToolUseBlockParam | ToolResultBlockParam
 */

import { z } from 'zod';

import { textBlockParamContract } from '../text-block-param/text-block-param-contract';
import { thinkingBlockParamContract } from '../thinking-block-param/thinking-block-param-contract';
import { redactedThinkingBlockParamContract } from '../redacted-thinking-block-param/redacted-thinking-block-param-contract';
import { toolUseBlockParamContract } from '../tool-use-block-param/tool-use-block-param-contract';
import { toolResultBlockParamContract } from '../tool-result-block-param/tool-result-block-param-contract';

export const assistantContentBlockParamContract = z.discriminatedUnion('type', [
  textBlockParamContract,
  thinkingBlockParamContract,
  redactedThinkingBlockParamContract,
  toolUseBlockParamContract,
  toolResultBlockParamContract,
]);

export type AssistantContentBlockParam = z.infer<typeof assistantContentBlockParamContract>;

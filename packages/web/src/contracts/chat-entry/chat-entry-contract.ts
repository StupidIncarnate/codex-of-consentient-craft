/**
 * PURPOSE: Defines chat entry types for user messages and assistant responses in quest chat
 *
 * USAGE:
 * chatEntryContract.parse({role: 'user', content: 'Hello'});
 * // Returns validated ChatEntry object
 */

import { z } from 'zod';

const chatUsageContract = z.object({
  inputTokens: z.number().int().nonnegative().brand<'InputTokens'>(),
  outputTokens: z.number().int().nonnegative().brand<'OutputTokens'>(),
  cacheCreationInputTokens: z.number().int().nonnegative().brand<'CacheCreationInputTokens'>(),
  cacheReadInputTokens: z.number().int().nonnegative().brand<'CacheReadInputTokens'>(),
});

export type ChatUsage = z.infer<typeof chatUsageContract>;

const userEntryContract = z.object({
  role: z.literal('user'),
  content: z.string().min(1).brand<'UserContent'>(),
});

const assistantTextEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('text'),
  content: z.string().brand<'AssistantContent'>(),
  usage: chatUsageContract.optional(),
});

const assistantToolUseEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('tool_use'),
  toolName: z.string().min(1).brand<'ToolName'>(),
  toolInput: z.string().brand<'ToolInput'>(),
});

const assistantToolResultEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('tool_result'),
  toolName: z.string().min(1).brand<'ToolName'>(),
  content: z.string().brand<'ToolResultContent'>(),
});

export const chatEntryContract = z.union([
  userEntryContract,
  assistantTextEntryContract,
  assistantToolUseEntryContract,
  assistantToolResultEntryContract,
]);

export type ChatEntry = z.infer<typeof chatEntryContract>;

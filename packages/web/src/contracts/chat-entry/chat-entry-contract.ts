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

const sourceContract = z.enum(['session', 'subagent']).optional();

const userEntryContract = z.object({
  role: z.literal('user'),
  content: z.string().min(1).brand<'UserContent'>(),
  source: sourceContract,
});

const assistantTextEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('text'),
  content: z.string().brand<'AssistantContent'>(),
  usage: chatUsageContract.optional(),
  source: sourceContract,
});

const assistantToolUseEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('tool_use'),
  toolName: z.string().min(1).brand<'ToolName'>(),
  toolInput: z.string().brand<'ToolInput'>(),
  usage: chatUsageContract.optional(),
  source: sourceContract,
});

const assistantToolResultEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('tool_result'),
  toolName: z.string().min(1).brand<'ToolName'>(),
  content: z.string().brand<'ToolResultContent'>(),
  isError: z.boolean().optional(),
  source: sourceContract,
});

const taskNotificationEntryContract = z.object({
  role: z.literal('system'),
  type: z.literal('task_notification'),
  taskId: z.string().min(1).brand<'TaskId'>(),
  status: z.string().min(1).brand<'TaskStatus'>(),
  summary: z.string().brand<'TaskSummary'>().optional(),
  result: z.string().brand<'TaskResult'>().optional(),
  totalTokens: z.number().int().nonnegative().brand<'TotalTokens'>().optional(),
  toolUses: z.number().int().nonnegative().brand<'ToolUses'>().optional(),
  durationMs: z.number().int().nonnegative().brand<'DurationMs'>().optional(),
  source: sourceContract,
});

const systemErrorEntryContract = z.object({
  role: z.literal('system'),
  type: z.literal('error'),
  content: z.string().min(1).brand<'ErrorContent'>(),
  source: sourceContract,
});

export const chatEntryContract = z.union([
  userEntryContract,
  assistantTextEntryContract,
  assistantToolUseEntryContract,
  assistantToolResultEntryContract,
  taskNotificationEntryContract,
  systemErrorEntryContract,
]);

export type ChatEntry = z.infer<typeof chatEntryContract>;

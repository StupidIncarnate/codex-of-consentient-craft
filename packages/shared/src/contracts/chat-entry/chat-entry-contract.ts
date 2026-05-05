/**
 * PURPOSE: Defines chat entry types for user messages and assistant responses in quest chat
 *
 * USAGE:
 * chatEntryContract.parse({role: 'user', content: 'Hello', uuid: '<uuid>', timestamp: '<iso>'});
 * // Returns validated ChatEntry object
 *
 * Every entry carries `uuid` (per-line correlation key) and `timestamp` (ISO datetime).
 * The web binding keys entries by uuid for dedup and sorts by timestamp so streaming
 * (which emits in arrival order, with sub-agent activity arriving via two sources at
 * different times) and replay (which sorts by timestamp before emission) produce
 * identical DOM. Without these fields, the dual-source convergence in
 * chat-line-process-transformer would silently produce duplicates and out-of-order
 * sub-agent chains.
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
const agentIdContract = z.string().min(1).brand<'AgentId'>().optional();

const modelContract = z.string().min(1).brand<'ModelName'>().optional();

// `uuid` is a per-entry correlation key, stable across sources. Format is
// `<line-uuid>:<content-item-index>` for entries derived from a parsed Claude CLI line, OR a
// raw uuid for synthetic web-side entries. The web binding uses this as a Map key for
// dedup — both the parent stdout and the sub-agent JSONL tail emit the same key for the
// same content, collapsing duplicates that arise from the dual-source convergence.
const uuidContract = z.string().min(1).brand<'ChatEntryUuid'>();
const timestampContract = z.string().datetime().brand<'IsoTimestamp'>();

export type ChatEntryUuid = z.infer<typeof uuidContract>;
export type IsoTimestamp = z.infer<typeof timestampContract>;

const userEntryContract = z.object({
  role: z.literal('user'),
  content: z.string().min(1).brand<'UserContent'>(),
  isInjectedPrompt: z.boolean().optional(),
  source: sourceContract,
  agentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
});

const assistantTextEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('text'),
  content: z.string().brand<'AssistantContent'>(),
  model: modelContract,
  usage: chatUsageContract.optional(),
  source: sourceContract,
  agentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
});

const assistantToolUseEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('tool_use'),
  toolUseId: z.string().min(1).brand<'ToolUseId'>().optional(),
  toolName: z.string().min(1).brand<'ToolName'>(),
  toolInput: z.string().brand<'ToolInput'>(),
  model: modelContract,
  usage: chatUsageContract.optional(),
  source: sourceContract,
  agentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
});

const assistantThinkingEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('thinking'),
  content: z.string().brand<'ThinkingContent'>(),
  model: modelContract,
  source: sourceContract,
  agentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
});

const assistantToolResultEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('tool_result'),
  toolName: z.string().min(1).brand<'ToolName'>(),
  content: z.string().brand<'ToolResultContent'>(),
  isError: z.boolean().optional(),
  source: sourceContract,
  agentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
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
  agentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
});

const systemErrorEntryContract = z.object({
  role: z.literal('system'),
  type: z.literal('error'),
  content: z.string().min(1).brand<'ErrorContent'>(),
  source: sourceContract,
  agentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
});

export const chatEntryContract = z.union([
  userEntryContract,
  assistantTextEntryContract,
  assistantToolUseEntryContract,
  assistantThinkingEntryContract,
  assistantToolResultEntryContract,
  taskNotificationEntryContract,
  systemErrorEntryContract,
]);

export type ChatEntry = z.infer<typeof chatEntryContract>;

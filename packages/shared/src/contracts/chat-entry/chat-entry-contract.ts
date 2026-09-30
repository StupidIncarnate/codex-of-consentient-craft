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

import { z } from '#gateway/npm/zod';

const chatUsageContract = z.object({
  inputTokens: z.number().int().nonnegative().brand<'ChatUsageInputTokens'>(),
  outputTokens: z.number().int().nonnegative().brand<'ChatUsageOutputTokens'>(),
  cacheCreationInputTokens: z.number().int().nonnegative().brand<'ChatUsageCacheCreationInputTokens'>(),
  cacheReadInputTokens: z.number().int().nonnegative().brand<'ChatUsageCacheReadInputTokens'>(),
}).brand<'ChatUsage'>();

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
const timestampContract = z.iso.datetime().brand<'IsoTimestamp'>();

export type ChatEntryUuid = z.infer<typeof uuidContract>;
export type IsoTimestamp = z.infer<typeof timestampContract>;

const userEntryContract = z.object({
  role: z.literal('user'),
  content: z.string().min(1).brand<'UserEntryContent'>(),
  isInjectedPrompt: z.boolean().optional(),
  source: sourceContract,
  agentId: agentIdContract,
  parentAgentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
}).brand<'UserEntry'>();

const assistantTextEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('text'),
  content: z.string().brand<'AssistantTextEntryContent'>(),
  model: modelContract,
  usage: chatUsageContract.optional(),
  source: sourceContract,
  agentId: agentIdContract,
  parentAgentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
}).brand<'AssistantTextEntry'>();

const assistantToolUseEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('tool_use'),
  toolUseId: z.string().min(1).brand<'AssistantToolUseEntryToolUseId'>().optional(),
  toolName: z.string().min(1).brand<'AssistantToolUseEntryToolName'>(),
  toolInput: z.string().brand<'AssistantToolUseEntryToolInput'>(),
  model: modelContract,
  usage: chatUsageContract.optional(),
  source: sourceContract,
  agentId: agentIdContract,
  parentAgentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
}).brand<'AssistantToolUseEntry'>();

const assistantThinkingEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('thinking'),
  content: z.string().brand<'AssistantThinkingEntryContent'>(),
  model: modelContract,
  source: sourceContract,
  agentId: agentIdContract,
  parentAgentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
}).brand<'AssistantThinkingEntry'>();

const assistantToolResultEntryContract = z.object({
  role: z.literal('assistant'),
  type: z.literal('tool_result'),
  toolName: z.string().min(1).brand<'AssistantToolResultEntryToolName'>(),
  content: z.string().brand<'AssistantToolResultEntryContent'>(),
  isError: z.boolean().optional(),
  // Claude CLI reports a BLOCKING sub-agent call's own elapsed time here, from the completion
  // line's `toolUseResult.totalDurationMs`. An ASYNC launch reports nothing here — its result
  // lands milliseconds after dispatch — and sends a `<task-notification>` carrying `durationMs`
  // when the agent finishes. So the two duration sources are mutually exclusive per call, and a
  // chain that has neither is one still running.
  durationMs: z.number().int().nonnegative().brand<'AssistantToolResultEntryDurationMs'>().optional(),
  source: sourceContract,
  agentId: agentIdContract,
  parentAgentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
}).brand<'AssistantToolResultEntry'>();

const taskNotificationEntryContract = z.object({
  role: z.literal('system'),
  type: z.literal('task_notification'),
  taskId: z.string().min(1).brand<'TaskNotificationEntryTaskId'>(),
  status: z.string().min(1).brand<'TaskNotificationEntryStatus'>(),
  summary: z.string().brand<'TaskNotificationEntrySummary'>().optional(),
  result: z.string().brand<'TaskNotificationEntryResult'>().optional(),
  totalTokens: z.number().int().nonnegative().brand<'TaskNotificationEntryTotalTokens'>().optional(),
  toolUses: z.number().int().nonnegative().brand<'TaskNotificationEntryToolUses'>().optional(),
  durationMs: z.number().int().nonnegative().brand<'TaskNotificationEntryDurationMs'>().optional(),
  source: sourceContract,
  agentId: agentIdContract,
  parentAgentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
}).brand<'TaskNotificationEntry'>();

const systemErrorEntryContract = z.object({
  role: z.literal('system'),
  type: z.literal('error'),
  content: z.string().min(1).brand<'SystemErrorEntryContent'>(),
  source: sourceContract,
  agentId: agentIdContract,
  parentAgentId: agentIdContract,
  uuid: uuidContract,
  timestamp: timestampContract,
}).brand<'SystemErrorEntry'>();

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

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
import { agentContract } from '../agent/agent-contract';
import { toolUseContract } from '../tool-use/tool-use-contract';

const chatUsageContract = z
  .object({
    inputTokens: z.number().int().nonnegative().brand<'ChatUsageInputTokens'>(),
    outputTokens: z.number().int().nonnegative().brand<'ChatUsageOutputTokens'>(),
    cacheCreationInputTokens: z
      .number()
      .int()
      .nonnegative()
      .brand<'ChatUsageCacheCreationInputTokens'>(),
    cacheReadInputTokens: z.number().int().nonnegative().brand<'ChatUsageCacheReadInputTokens'>(),
  })
  .brand<'ChatUsage'>();

export type ChatUsage = z.infer<typeof chatUsageContract>;

const sourceContract = z.enum(['session', 'subagent']).optional();

const userEntryContract = z
  .object({
    role: z.literal('user'),
    content: z.string().min(1).brand<'UserEntryContent'>(),
    isInjectedPrompt: z.boolean().optional(),
    source: sourceContract,
    agentId: agentContract.shape.id.optional(),
    parentAgentId: agentContract.shape.id.optional(),
    uuid: z.string().min(1).brand<'UserEntryUuid'>(),
    timestamp: z.iso.datetime().brand<'UserEntryTimestamp'>(),
  })
  .brand<'UserEntry'>();

const assistantTextEntryContract = z
  .object({
    role: z.literal('assistant'),
    type: z.literal('text'),
    content: z.string().brand<'AssistantTextEntryContent'>(),
    model: z.string().min(1).brand<'AssistantTextEntryModel'>().optional(),
    usage: chatUsageContract.optional(),
    source: sourceContract,
    agentId: agentContract.shape.id.optional(),
    parentAgentId: agentContract.shape.id.optional(),
    uuid: z.string().min(1).brand<'AssistantTextEntryUuid'>(),
    timestamp: z.iso.datetime().brand<'AssistantTextEntryTimestamp'>(),
  })
  .brand<'AssistantTextEntry'>();

const assistantToolUseEntryContract = z
  .object({
    role: z.literal('assistant'),
    type: z.literal('tool_use'),
    toolUseId: toolUseContract.shape.id.optional(),
    toolName: z.string().min(1).brand<'AssistantToolUseEntryToolName'>(),
    toolInput: z.string().brand<'AssistantToolUseEntryToolInput'>(),
    model: z.string().min(1).brand<'AssistantToolUseEntryModel'>().optional(),
    usage: chatUsageContract.optional(),
    source: sourceContract,
    agentId: agentContract.shape.id.optional(),
    parentAgentId: agentContract.shape.id.optional(),
    uuid: z.string().min(1).brand<'AssistantToolUseEntryUuid'>(),
    timestamp: z.iso.datetime().brand<'AssistantToolUseEntryTimestamp'>(),
  })
  .brand<'AssistantToolUseEntry'>();

const assistantThinkingEntryContract = z
  .object({
    role: z.literal('assistant'),
    type: z.literal('thinking'),
    content: z.string().brand<'AssistantThinkingEntryContent'>(),
    model: z.string().min(1).brand<'AssistantThinkingEntryModel'>().optional(),
    source: sourceContract,
    agentId: agentContract.shape.id.optional(),
    parentAgentId: agentContract.shape.id.optional(),
    uuid: z.string().min(1).brand<'AssistantThinkingEntryUuid'>(),
    timestamp: z.iso.datetime().brand<'AssistantThinkingEntryTimestamp'>(),
  })
  .brand<'AssistantThinkingEntry'>();

const assistantToolResultEntryContract = z
  .object({
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
    durationMs: z
      .number()
      .int()
      .nonnegative()
      .brand<'AssistantToolResultEntryDurationMs'>()
      .optional(),
    source: sourceContract,
    agentId: agentContract.shape.id.optional(),
    parentAgentId: agentContract.shape.id.optional(),
    uuid: z.string().min(1).brand<'AssistantToolResultEntryUuid'>(),
    timestamp: z.iso.datetime().brand<'AssistantToolResultEntryTimestamp'>(),
  })
  .brand<'AssistantToolResultEntry'>();

const taskNotificationEntryContract = z
  .object({
    role: z.literal('system'),
    type: z.literal('task_notification'),
    taskId: z.string().min(1).brand<'TaskNotificationEntryTaskId'>(),
    status: z.string().min(1).brand<'TaskNotificationEntryStatus'>(),
    summary: z.string().brand<'TaskNotificationEntrySummary'>().optional(),
    result: z.string().brand<'TaskNotificationEntryResult'>().optional(),
    totalTokens: z
      .number()
      .int()
      .nonnegative()
      .brand<'TaskNotificationEntryTotalTokens'>()
      .optional(),
    toolUses: z.number().int().nonnegative().brand<'TaskNotificationEntryToolUses'>().optional(),
    durationMs: z
      .number()
      .int()
      .nonnegative()
      .brand<'TaskNotificationEntryDurationMs'>()
      .optional(),
    source: sourceContract,
    agentId: agentContract.shape.id.optional(),
    parentAgentId: agentContract.shape.id.optional(),
    uuid: z.string().min(1).brand<'TaskNotificationEntryUuid'>(),
    timestamp: z.iso.datetime().brand<'TaskNotificationEntryTimestamp'>(),
  })
  .brand<'TaskNotificationEntry'>();

const systemErrorEntryContract = z
  .object({
    role: z.literal('system'),
    type: z.literal('error'),
    content: z.string().min(1).brand<'SystemErrorEntryContent'>(),
    source: sourceContract,
    agentId: agentContract.shape.id.optional(),
    parentAgentId: agentContract.shape.id.optional(),
    uuid: z.string().min(1).brand<'SystemErrorEntryUuid'>(),
    timestamp: z.iso.datetime().brand<'SystemErrorEntryTimestamp'>(),
  })
  .brand<'SystemErrorEntry'>();

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

// `uuid` is a per-entry correlation key, stable across sources. Format is
// `<line-uuid>:<content-item-index>` for entries derived from a parsed Claude CLI line, OR a
// raw uuid for synthetic web-side entries. The web binding uses this as a Map key for
// dedup — both the parent stdout and the sub-agent JSONL tail emit the same key for the
// same content, collapsing duplicates that arise from the dual-source convergence.
export type ChatEntryUuid = ChatEntry['uuid'];
export type IsoTimestamp = ChatEntry['timestamp'];

/**
 * PURPOSE: Validates the post-normalize (camelCased + XML-inflated) shape of a Claude CLI JSONL line
 * after it has flowed through `claudeLineNormalizeBroker`. Captures the union of shapes the chat-line
 * processor sees: assistant messages, user messages, plus the orchestrator's own enrichment fields
 * (`source`, `agentId`, `parentToolUseId`, `taskNotification`).
 *
 * USAGE:
 * const parsed = normalizedStreamLineContract.parse(claudeLineNormalizeBroker({ rawLine }));
 * // parsed.type, parsed.message?.content, parsed.parentToolUseId — all typed
 *
 * The schema is `.passthrough()` because the underlying Claude CLI emits a long tail of fields
 * (sessionId, uuid, parentUuid, isSidechain, timestamp, etc.) that downstream code does not need
 * to read. Validation guarantees the shapes we DO read; the rest are preserved by passthrough.
 */
import { z } from 'zod';

const _contentItem = z
  .object({
    type: z.string().brand<'StreamContentItemType'>().optional(),
    text: z.string().brand<'StreamContentText'>().optional(),
    thinking: z.string().brand<'StreamContentThinking'>().optional(),
    signature: z.string().brand<'StreamContentSignature'>().optional(),
    id: z.string().brand<'StreamContentId'>().optional(),
    name: z.string().brand<'StreamContentName'>().optional(),
    input: z.unknown().optional(),
    toolUseId: z.string().brand<'StreamContentToolUseId'>().optional(),
    content: z.unknown().optional(),
    isError: z.boolean().optional(),
    source: z.string().brand<'StreamContentSource'>().optional(),
    agentId: z.string().brand<'StreamContentAgentId'>().optional(),
  })
  .passthrough();

// Optional fields use `.nullish()` (= nullable + optional) because Claude CLI emits
// explicit `null` for stop_reason / model on streamed assistant deltas before the turn
// completes — `.optional()` alone rejects null and silently drops every assistant line.
const message = z
  .object({
    role: z.string().brand<'StreamMessageRole'>().nullish(),
    content: z.unknown().nullish(),
    usage: z.unknown().nullish(),
    stopReason: z.string().brand<'StreamMessageStopReason'>().nullish(),
    model: z.string().brand<'StreamMessageModel'>().nullish(),
  })
  .passthrough();

const taskNotification = z
  .object({
    taskId: z.string().brand<'StreamTaskNotificationTaskId'>().optional(),
    status: z.string().brand<'StreamTaskNotificationStatus'>().optional(),
    summary: z.string().brand<'StreamTaskNotificationSummary'>().optional(),
    result: z.string().brand<'StreamTaskNotificationResult'>().optional(),
    totalTokens: z
      .union([
        z.string().brand<'StreamTaskNotificationTotalTokensRaw'>(),
        z.number().brand<'StreamTaskNotificationTotalTokens'>(),
      ])
      .optional(),
    toolUses: z
      .union([
        z.string().brand<'StreamTaskNotificationToolUsesRaw'>(),
        z.number().brand<'StreamTaskNotificationToolUses'>(),
      ])
      .optional(),
    durationMs: z
      .union([
        z.string().brand<'StreamTaskNotificationDurationMsRaw'>(),
        z.number().brand<'StreamTaskNotificationDurationMs'>(),
      ])
      .optional(),
    toolUseId: z.string().brand<'StreamTaskNotificationToolUseId'>().optional(),
  })
  .passthrough();

const toolUseResult = z
  .object({
    agentId: z.unknown().optional(),
  })
  .passthrough();

export const normalizedStreamLineContract = z
  .object({
    type: z.string().brand<'NormalizedStreamLineType'>().optional(),
    subtype: z.string().brand<'NormalizedStreamLineSubtype'>().optional(),
    message: message.optional(),
    parentToolUseId: z
      .string()
      .brand<'NormalizedStreamLineParentToolUseId'>()
      .nullable()
      .optional(),
    toolUseResult: toolUseResult.optional(),
    taskNotification: taskNotification.optional(),
    source: z.string().brand<'NormalizedStreamLineSource'>().optional(),
    agentId: z.string().brand<'NormalizedStreamLineAgentId'>().optional(),
    sessionId: z.string().brand<'NormalizedStreamLineSessionId'>().optional(),
    timestamp: z.string().brand<'NormalizedStreamLineTimestamp'>().optional(),
  })
  .passthrough();

export type NormalizedStreamLine = z.infer<typeof normalizedStreamLineContract>;
export type NormalizedStreamLineContentItem = z.infer<typeof _contentItem>;

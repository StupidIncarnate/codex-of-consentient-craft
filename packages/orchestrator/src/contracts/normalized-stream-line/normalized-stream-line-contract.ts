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
 * The schema is `.loose()` because the underlying Claude CLI emits a long tail of fields
 * (sessionId, uuid, parentUuid, isSidechain, timestamp, etc.) that downstream code does not need
 * to read. Validation guarantees the shapes we DO read; the rest are preserved by passthrough.
 */
import { z } from '#gateway/npm/zod';
import { inflatedTaskNotificationContentContract } from '../inflated-task-notification-content/inflated-task-notification-content-contract';
import { normalizedStreamLineContentItemContract } from '../normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { agentContract, sessionContract } from '@dungeonmaster/shared/contracts';

const _contentItem = z
  .object({
    type: z.string().brand<'ContentItemType'>().optional(),
    text: z.string().brand<'ContentItemText'>().optional(),
    thinking: z.string().brand<'ContentItemThinking'>().optional(),
    signature: z.string().brand<'ContentItemSignature'>().optional(),
    id: z.string().brand<'ContentItemId'>().optional(),
    name: z.string().brand<'ContentItemName'>().optional(),
    input: z.json().optional(),
    toolUseId: z.string().brand<'ContentItemToolUseId'>().optional(),
    content: z.union([z.string(), z.array(normalizedStreamLineContentItemContract)]).optional(),
    isError: z.boolean().optional(),
    source: z.string().brand<'ContentItemSource'>().optional(),
    agentId: agentContract.shape.id.optional(),
  })
  .brand<'ContentItem'>()
  .loose();

// Optional fields use `.nullish()` (= nullable + optional) because Claude CLI emits
// explicit `null` for stop_reason / model on streamed assistant deltas before the turn
// completes — `.optional()` alone rejects null and silently drops every assistant line.
const message = z
  .object({
    role: z.string().brand<'MessageRole'>().nullish(),
    // Items stay `unknown`: a null or non-object entry must not reject the whole line, and every
    // reader re-parses each item through normalizedStreamLineContentItemContract at its own index.
    // The object form is the XML-inflated <task-notification> envelope, lifted by the chat-line processor.
    content: z
      .union([z.string(), z.array(z.unknown()), inflatedTaskNotificationContentContract])
      .nullish(),
    // camelCase: the line is normalized before it reaches this contract.
    usage: z
      .object({
        inputTokens: z.number().brand<'MessageUsageInputTokens'>().nullish(),
        outputTokens: z.number().brand<'MessageUsageOutputTokens'>().nullish(),
        cacheCreationInputTokens: z
          .number()
          .brand<'MessageUsageCacheCreationInputTokens'>()
          .nullish(),
        cacheReadInputTokens: z.number().brand<'MessageUsageCacheReadInputTokens'>().nullish(),
      })
      .brand<'MessageUsage'>()
      .loose()
      .nullish(),
    stopReason: z.string().brand<'MessageStopReason'>().nullish(),
    model: z.string().brand<'MessageModel'>().nullish(),
  })
  .brand<'Message'>()
  .loose();

const taskNotification = z
  .object({
    taskId: z.string().brand<'TaskNotificationTaskId'>().optional(),
    status: z.string().brand<'TaskNotificationStatus'>().optional(),
    summary: z.string().brand<'TaskNotificationSummary'>().optional(),
    result: z.string().brand<'TaskNotificationResult'>().optional(),
    totalTokens: z
      .union([
        z.string().brand<'TaskNotificationTotalTokens'>(),
        z.number().brand<'TaskNotificationTotalTokens'>(),
      ])
      .optional(),
    toolUses: z
      .union([
        z.string().brand<'TaskNotificationToolUses'>(),
        z.number().brand<'TaskNotificationToolUses'>(),
      ])
      .optional(),
    durationMs: z
      .union([
        z.string().brand<'TaskNotificationDurationMs'>(),
        z.number().brand<'TaskNotificationDurationMs'>(),
      ])
      .optional(),
    toolUseId: z.string().brand<'TaskNotificationToolUseId'>().optional(),
  })
  .brand<'TaskNotification'>()
  .loose();

// Claude CLI emits `toolUseResult` in three distinct shapes — Task / sub-agent object form
// (`{agentId, status, ...}`), MCP / Bash array form (`[{type:'text', text:'...'}]`), and
// tool-error string form ("Error: File content (N tokens) exceeds..."). All must parse;
// readers must narrow to the object branch before accessing `.agentId`.
const toolUseResult = z.union([
  z
    .object({
      // unknown: the CLI has emitted a non-string agentId, and the processor narrows to string before use.
      agentId: agentContract.shape.id.optional(),
      // Present on a BLOCKING Task/Agent completion only — the CLI's own measurement of that
      // sub-agent run. An async launch's result object carries no such field.
      totalDurationMs: z.number().brand<'ToolUseResultTotalDurationMs'>().nullish(),
    })
    .brand<'ToolUseResult'>()
    .loose(),
  z.array(z.json()),
  z.string().brand<'NormalizedToolUseResultErrorMessage'>(),
]);

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
    agentId: agentContract.shape.id.optional(),
    sessionId: sessionContract.shape.id.optional(),
    timestamp: z.string().brand<'NormalizedStreamLineTimestamp'>().optional(),
    uuid: z.string().brand<'NormalizedStreamLineUuid'>().optional(),
  })
  .loose()
  .brand<'NormalizedStreamLine'>();

export type NormalizedStreamLine = z.infer<typeof normalizedStreamLineContract>;
export type NormalizedStreamLineContentItem = z.infer<typeof _contentItem>;

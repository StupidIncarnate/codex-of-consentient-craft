/**
 * PURPOSE: Validates a single content item inside a `message.content[]` array of a normalized
 * (camelCased) Claude CLI JSONL line. Models the discriminated union of all assistant content
 * variants — text, thinking, redacted_thinking, tool_use, tool_result — with camelCase field names
 * that mirror the SDK's snake_case shapes after `claudeLineNormalizeBroker` converts the wire.
 *
 * Two orchestrator-injected fields (`source`, `agentId`) are present as optional passthrough on
 * every variant — they aren't part of the SDK shape but are stamped post-normalization to carry
 * sub-agent correlation metadata through the funnel.
 *
 * USAGE:
 * const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
 * if (itemParse.success) {
 *   const item = itemParse.data;
 *   if (item.type === 'tool_use') { ... }
 * }
 *
 * `.passthrough()` on every variant so unread fields (e.g., source/agentId stamps) survive parsing.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared correlation fields (orchestrator-injected post-normalization)
// ---------------------------------------------------------------------------
const correlationFields = {
  source: z.string().brand<'StreamContentSource'>().optional(),
  agentId: z.string().brand<'StreamContentAgentId'>().optional(),
};

// ---------------------------------------------------------------------------
// Individual camelCase variant contracts
// ---------------------------------------------------------------------------

const textVariantContract = z
  .object({
    type: z.literal('text'),
    text: z.string().brand<'StreamContentText'>(),
    ...correlationFields,
  })
  .passthrough();

const thinkingVariantContract = z
  .object({
    type: z.literal('thinking'),
    thinking: z.string().brand<'StreamContentThinking'>(),
    signature: z.string().brand<'StreamContentSignature'>().optional(),
    ...correlationFields,
  })
  .passthrough();

const redactedThinkingVariantContract = z
  .object({
    type: z.literal('redacted_thinking'),
    data: z.string().brand<'StreamContentRedactedData'>(),
    ...correlationFields,
  })
  .passthrough();

const toolUseVariantContract = z
  .object({
    type: z.literal('tool_use'),
    id: z.string().brand<'StreamContentId'>().optional(),
    name: z.string().brand<'StreamContentName'>().optional(),
    input: z.unknown().optional(),
    ...correlationFields,
  })
  .passthrough();

// Camelcase parallel to ToolResultBlockParam — `tool_use_id` → `toolUseId`, `is_error` → `isError`
// The `content` field is a string or an array of camelCase content items (recursive).
const toolResultVariantContract = z
  .object({
    type: z.literal('tool_result'),
    toolUseId: z.string().brand<'StreamContentToolUseId'>().optional(),
    content: z.unknown().optional(),
    isError: z.boolean().optional(),
    ...correlationFields,
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export const normalizedStreamLineContentItemContract = z.discriminatedUnion('type', [
  textVariantContract,
  thinkingVariantContract,
  redactedThinkingVariantContract,
  toolUseVariantContract,
  toolResultVariantContract,
]);

export type NormalizedStreamLineContentItem = z.infer<
  typeof normalizedStreamLineContentItemContract
>;

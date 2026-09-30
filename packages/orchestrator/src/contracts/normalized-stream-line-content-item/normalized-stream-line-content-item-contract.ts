/**
 * PURPOSE: Validates a single content item inside a `message.content[]` array of a normalized
 * (camelCased) Claude CLI JSONL line. Captures the union of fields seen across the assistant
 * variants: text blocks, thinking blocks, tool_use blocks, tool_result blocks.
 *
 * USAGE:
 * const item = normalizedStreamLineContentItemContract.parse(rawItem);
 * if (item.type === 'tool_use') { ... }
 *
 * `.loose()` so unread fields (e.g., MCP-injected metadata) survive validation.
 */
import { z } from '#gateway/npm/zod';
import { agentContract } from '@dungeonmaster/shared/contracts';

export const normalizedStreamLineContentItemContract = z
  .object({
    type: z.string().brand<'NormalizedStreamLineContentItemType'>().optional(),
    text: z.string().brand<'NormalizedStreamLineContentItemText'>().optional(),
    thinking: z.string().brand<'NormalizedStreamLineContentItemThinking'>().optional(),
    signature: z.string().brand<'NormalizedStreamLineContentItemSignature'>().optional(),
    id: z.string().brand<'NormalizedStreamLineContentItemId'>().optional(),
    name: z.string().brand<'NormalizedStreamLineContentItemName'>().optional(),
    input: z.json().optional(),
    toolUseId: z.string().brand<'NormalizedStreamLineContentItemToolUseId'>().optional(),
    toolName: z.string().brand<'NormalizedStreamLineContentItemToolName'>().optional(),
    title: z.string().brand<'NormalizedStreamLineContentItemTitle'>().optional(),
    content: z.unknown().optional(),
    isError: z.boolean().optional(),
    source: z.string().brand<'NormalizedStreamLineContentItemSource'>().optional(),
    agentId: agentContract.shape.id.optional(),
  })
  .loose()
  .brand<'NormalizedStreamLineContentItem'>();

export type NormalizedStreamLineContentItem = z.infer<
  typeof normalizedStreamLineContentItemContract
>;

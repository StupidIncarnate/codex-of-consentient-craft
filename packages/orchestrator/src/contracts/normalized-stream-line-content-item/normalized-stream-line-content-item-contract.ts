/**
 * PURPOSE: Validates a single content item inside a `message.content[]` array of a normalized
 * (camelCased) Claude CLI JSONL line. Captures the union of fields seen across the assistant
 * variants: text blocks, thinking blocks, tool_use blocks, tool_result blocks.
 *
 * USAGE:
 * const item = normalizedStreamLineContentItemContract.parse(rawItem);
 * if (item.type === 'tool_use') { ... }
 *
 * `.passthrough()` so unread fields (e.g., MCP-injected metadata) survive validation.
 */
import { z } from 'zod';

export const normalizedStreamLineContentItemContract = z
  .object({
    type: z.string().brand<'StreamContentItemType'>().optional(),
    text: z.string().brand<'StreamContentText'>().optional(),
    thinking: z.string().brand<'StreamContentThinking'>().optional(),
    signature: z.string().brand<'StreamContentSignature'>().optional(),
    id: z.string().brand<'StreamContentId'>().optional(),
    name: z.string().brand<'StreamContentName'>().optional(),
    input: z.unknown().optional(),
    toolUseId: z.string().brand<'StreamContentToolUseId'>().optional(),
    toolName: z.string().brand<'StreamContentToolName'>().optional(),
    title: z.string().brand<'StreamContentTitle'>().optional(),
    content: z.unknown().optional(),
    isError: z.boolean().optional(),
    source: z.string().brand<'StreamContentSource'>().optional(),
    agentId: z.string().brand<'StreamContentAgentId'>().optional(),
  })
  .passthrough();

export type NormalizedStreamLineContentItem = z.infer<
  typeof normalizedStreamLineContentItemContract
>;

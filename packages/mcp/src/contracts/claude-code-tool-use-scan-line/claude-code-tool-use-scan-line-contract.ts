/**
 * PURPOSE: Loose schema for assistant-message JSONL lines from a Claude CLI sub-agent
 * transcript. Used by claudeCodeParentSessionFindByToolUseIdBroker to match a
 * `_meta.claudecode/toolUseId` against the tool_use ids the sub-agent recorded. Only
 * the `message.content[].type` and `message.content[].id` fields are consumed; every
 * other field passes through via `.passthrough()` so future Claude CLI shape additions
 * don't reject the line.
 *
 * USAGE:
 * const parsed = claudeCodeToolUseScanLineContract.safeParse(JSON.parse(jsonlLine));
 * if (parsed.success) {
 *   const content = parsed.data.message?.content ?? [];
 *   const hit = content.some((item) => item.type === 'tool_use' && item.id === toolUseId);
 * }
 */

import { z } from 'zod';

export const claudeCodeToolUseScanLineContract = z
  .object({
    message: z
      .object({
        content: z
          .array(
            z
              .object({
                type: z.string().brand<'ToolUseScanContentItemType'>(),
                id: z.string().brand<'ToolUseScanContentItemId'>().optional(),
              })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type ClaudeCodeToolUseScanLine = z.infer<typeof claudeCodeToolUseScanLineContract>;

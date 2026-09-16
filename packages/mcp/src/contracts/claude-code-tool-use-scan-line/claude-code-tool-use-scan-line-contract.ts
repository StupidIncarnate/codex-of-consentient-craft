/**
 * PURPOSE: Loose schema for assistant-message JSONL lines from a Claude CLI session or
 * sub-agent transcript. Used by claudeCodeParentSessionFindByToolUseIdBroker and
 * claudeCodeCallerCwdFindByToolUseIdBroker to match a `_meta.claudecode/toolUseId` against
 * the tool_use ids a session recorded, and to read the top-level `cwd` Claude Code stamps on
 * that same line. `cwd` is what makes the caller's real (possibly worktree-pinned) location
 * resolvable at all — if a future Claude CLI stops writing it, every caller falls back to the
 * MCP server's own startup cwd, loudly (see callerRepoRootResolveBroker). Every other field
 * passes through via `.passthrough()` so future Claude CLI shape additions don't reject the
 * line.
 *
 * USAGE:
 * const parsed = claudeCodeToolUseScanLineContract.safeParse(JSON.parse(jsonlLine));
 * if (parsed.success) {
 *   const content = parsed.data.message?.content ?? [];
 *   const hit = content.some((item) => item.type === 'tool_use' && item.id === toolUseId);
 *   const cwd = parsed.data.cwd;
 * }
 */

import { z } from 'zod';

export const claudeCodeToolUseScanLineContract = z
  .object({
    cwd: z.string().brand<'ToolUseScanLineCwd'>().optional(),
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

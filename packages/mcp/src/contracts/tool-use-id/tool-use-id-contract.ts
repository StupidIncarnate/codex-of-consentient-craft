/**
 * PURPOSE: Branded string for the parent's Task() tool-use id Claude Code surfaces on every
 * MCP call via `request.params._meta.claudecode/toolUseId`. Used to deterministically identify
 * the calling sub-agent when stamping work-item identity in `get-agent-prompt`.
 *
 * USAGE:
 * toolUseIdContract.parse('toolu_01B3VQHjYXB5Wap7jrw1T3uS');
 * // Returns branded ToolUseId
 */

import { z } from 'zod';

export const toolUseIdContract = z.string().min(1).brand<'ToolUseId'>();

export type ToolUseId = z.infer<typeof toolUseIdContract>;

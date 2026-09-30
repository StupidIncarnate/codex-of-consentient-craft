/**
 * PURPOSE: Who made an MCP call, as Claude Code told the PreToolUse hook that ran before it: the
 *   caller's working directory, its session, and — for a Task-dispatched sub-agent only — its
 *   agent id, which is the id in that sub-agent's `subagents/agent-<id>.jsonl` filename. Reach for
 *   this over a transcript scan keyed on `claudecode/toolUseId`: the hook runs before the call is
 *   sent, while the call's own transcript line is not written until the call returns.
 *
 * USAGE:
 * mcpCallerContextContract.parse({ cwd: '/repo/worktrees/x', sessionId: '9c4d8f1c-...', agentId: 'a493e1c2168b46114' });
 * // Returns McpCallerContext
 */

import { z } from '#gateway/npm/zod';

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { agentContract } from '../agent/agent-contract';
import { sessionContract } from '../session/session-contract';

export const mcpCallerContextContract = z.object({
  cwd: absoluteFilePathContract,
  sessionId: sessionContract.shape.id,
  agentId: agentContract.shape.id.optional(),
});

export type McpCallerContext = z.infer<typeof mcpCallerContextContract>;

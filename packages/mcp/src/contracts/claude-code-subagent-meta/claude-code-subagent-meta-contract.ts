/**
 * PURPOSE: Validates the shape of each `subagents/agent-<realAgentId>.meta.json` sidecar Claude
 * Code writes when it dispatches a Task() sub-agent. Used by find-by-tool-use-id-broker to
 * extract the `toolUseId` field for matching against `request.params._meta.claudecode/toolUseId`.
 *
 * USAGE:
 * const parsed = claudeCodeSubagentMetaContract.safeParse(JSON.parse(metaJsonContents));
 * if (parsed.success) { ... parsed.data.toolUseId ... }
 */

import { z } from 'zod';

import { toolUseIdContract } from '../tool-use-id/tool-use-id-contract';

// `agentType`, `description` also appear in the file but are not consumed here. `.passthrough()`
// keeps the contract loose so a future Claude Code change adding more fields doesn't reject.
export const claudeCodeSubagentMetaContract = z
  .object({
    toolUseId: toolUseIdContract,
  })
  .passthrough();

export type ClaudeCodeSubagentMeta = z.infer<typeof claudeCodeSubagentMetaContract>;

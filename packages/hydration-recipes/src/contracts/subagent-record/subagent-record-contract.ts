/**
 * PURPOSE: One sub-agent transcript now on disk — what the `write` route hands back once it has
 * appended the sub-agent's own JSONL file (and, when `completed` was true, the correlation line on
 * its parent session). Reach for this over its sibling, `subagentFieldsContract`, on a route's
 * OUTPUT side: `filePath` and `lineCount` are values the route computes, never something a caller
 * supplies. As with `sessionRecordContract`, there is no whole-subagent contract anywhere else in
 * this repo to derive from, so this file assembles the shape out of the per-field contracts that do.
 *
 * USAGE:
 * subagentRecordContract.parse({
 *   agentId: 'seed-agent-1',
 *   toolUseId: 'toolu_seed1',
 *   filePath: '/tmp/guilds-under-test/guild-1/.claude/projects/-tmp-guild-1/seed-session-1/subagents/agent-seed-agent-1.jsonl',
 *   lineCount: 1,
 * });
 * // Returns SubagentRecord
 */
import { z } from '#gateway/npm/zod';

import { agentContract } from '@dungeonmaster/shared/contracts';

import { toolUseIdContract } from '../tool-use-id/tool-use-id-contract';

export const subagentRecordContract = z
  .object({
    agentId: agentContract.shape.id,
    toolUseId: toolUseIdContract,
    filePath: z
      .string()
      .min(1)
      .refine(
        (path) => {
          if (path.startsWith('/')) {
            return true;
          }
          if (/^[A-Za-z]:\\/u.test(path)) {
            return true;
          }
          return false;
        },
        { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
      )
      .brand<'SubagentRecordFilePath'>(),
    lineCount: z.number().int().positive().brand<'SubagentRecordLineCount'>(),
  })
  .brand<'SubagentRecord'>();

export type SubagentRecord = z.infer<typeof subagentRecordContract>;

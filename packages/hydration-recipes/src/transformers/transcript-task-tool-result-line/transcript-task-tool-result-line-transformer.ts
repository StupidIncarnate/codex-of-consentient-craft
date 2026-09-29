/**
 * PURPOSE: One user line closing a sub-agent's Task tool_use, parsed through the shared stream-line
 * contract. Reach for this over `TaskToolResultStreamLineStub` inside a recipe: production code reads
 * literals and a contract, never a `.stub`. `toolUseResult.agentId` is what the chat replay pairs the
 * sub-agent's own file to its Task by. The line carries no `uuid` or `timestamp` — the caller
 * spreads those over it.
 *
 * USAGE:
 * transcriptTaskToolResultLineTransformer({ toolUseId: 'toolu_1', content: 'done', agentId: 'agent-1' });
 * // Returns { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', ... }] }, toolUseResult: { agentId: 'agent-1' } }
 */

import { userToolResultStreamLineContract } from '@dungeonmaster/shared/contracts';
import type { UserToolResultStreamLine } from '@dungeonmaster/shared/contracts';

export const transcriptTaskToolResultLineTransformer = ({
  toolUseId,
  content,
  agentId,
}: {
  toolUseId: string;
  content: string;
  agentId: string;
}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: toolUseId, content }],
    },
    toolUseResult: { agentId },
  });

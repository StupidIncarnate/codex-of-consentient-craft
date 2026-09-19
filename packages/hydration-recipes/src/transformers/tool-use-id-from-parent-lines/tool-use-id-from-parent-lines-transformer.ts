/**
 * PURPOSE: Finds the `toolUseId` correlated to a sub-agent's `agentId` by scanning the parent
 * session's own JSONL lines for the ONE line where `toolUseResult.agentId` and the content
 * item's `tool_use_id` co-occur — the shape `packages/orchestrator/CLAUDE.md`'s "Two-source
 * sub-agent correlation" describes. Reach for this over trusting the sub-agent's own file: a
 * file-sourced sub-agent line never carries `toolUseId` itself, only `agentId`.
 *
 * USAGE:
 * toolUseIdFromParentLinesTransformer({ parentLines: [line1, line2], agentId: AgentIdStub() });
 * // Returns the correlated ToolUseId if found, else undefined
 */
import { agentIdContract, userToolResultStreamLineContract } from '@dungeonmaster/shared/contracts';
import type { AgentId } from '@dungeonmaster/shared/contracts';

import { toolUseIdContract } from '../../contracts/tool-use-id/tool-use-id-contract';
import type { ToolUseId } from '../../contracts/tool-use-id/tool-use-id-contract';

export const toolUseIdFromParentLinesTransformer = ({
  parentLines,
  agentId,
}: {
  parentLines: readonly string[];
  agentId: AgentId;
}): ToolUseId | undefined => {
  // `toolUseResult` is a three-shape union (object-with-agentId / unknown[] / branded error
  // string) — the same narrowing `chat-line-process-transformer.ts` uses for this exact contract.
  // Its `agentId` is branded `AgentIdCorrelation`, a different brand than this file's `AgentId`,
  // so it is re-parsed through `agentIdContract` rather than compared across brands directly.
  const correlated = parentLines
    .map((line) => userToolResultStreamLineContract.safeParse(JSON.parse(line)))
    .find((parsed) => {
      if (!parsed.success) {
        return false;
      }
      const { toolUseResult } = parsed.data;
      if (
        toolUseResult === undefined ||
        typeof toolUseResult === 'string' ||
        Array.isArray(toolUseResult)
      ) {
        return false;
      }
      return (
        typeof toolUseResult.agentId === 'string' &&
        agentIdContract.parse(toolUseResult.agentId) === agentId
      );
    });

  if (!correlated?.success) {
    return undefined;
  }

  const [firstContentItem] = correlated.data.message.content;

  // `content` items are a `type`-discriminated union (`text` | `tool_result`); only the
  // `tool_result` arm carries `tool_use_id`.
  if (firstContentItem === undefined || firstContentItem.type !== 'tool_result') {
    return undefined;
  }

  return toolUseIdContract.parse(firstContentItem.tool_use_id);
};

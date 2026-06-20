/**
 * PURPOSE: Decides whether a stopping sub-agent must be blocked from ending its turn — true only when the transcript shows a work-item agent (a get-agent-prompt call carrying a workItemId) that never called signal-back, and the stop is not already a re-entry from a prior block
 *
 * USAGE:
 * subagentStopNeedsBlockGuard({ invocations, stopHookActive: false });
 * // Returns true to block the stop (force a signal-back); false to let the sub-agent stop
 *
 * WHEN-TO-USE: From the SubagentStop hook responder, on every sub-agent completion
 * WHEN-NOT-TO-USE: For minions (get-agent-prompt with no workItemId) — they return a summary and never signal
 */

import { dungeonmasterMcpToolsStatics } from '../../statics/dungeonmaster-mcp-tools/dungeonmaster-mcp-tools-statics';
import type { TranscriptToolInvocation } from '../../contracts/transcript-tool-invocation/transcript-tool-invocation-contract';

export const subagentStopNeedsBlockGuard = ({
  invocations,
  stopHookActive,
}: {
  invocations?: TranscriptToolInvocation[];
  stopHookActive?: boolean;
}): boolean => {
  // Already a re-entry from a prior block: nudge once, then fall through to orchestrator orphan
  // recovery rather than risk an infinite block loop on a genuinely wedged agent.
  if (stopHookActive === true) {
    return false;
  }

  const list = invocations ?? [];

  const isWorkItemAgent = list.some(
    (invocation) =>
      invocation.name === dungeonmasterMcpToolsStatics.getAgentPromptToolName &&
      invocation.workItemId !== null,
  );
  if (!isWorkItemAgent) {
    return false;
  }

  const hasSignalBack = list.some(
    (invocation) => invocation.name === dungeonmasterMcpToolsStatics.signalBackToolName,
  );

  return !hasSignalBack;
};

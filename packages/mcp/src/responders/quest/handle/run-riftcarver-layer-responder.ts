/**
 * PURPOSE: Handles the `run-riftcarver` MCP tool call — blocks on the orchestrator while a quest's
 * branch, worktree, node_modules mirror and preflight build are forged, then hands the outcome back
 * to the /dumpster-launch loop that asked for it.
 *
 * USAGE:
 * const response = await RunRiftcarverLayerResponder({ args });
 * // Returns ToolResponse carrying the QuestRunRiftcarverResult JSON, or the JSON error shape
 *
 * Split out of QuestHandleResponder as a layer, mirroring quest-summary-layer-responder: that
 * responder is one long tool switch sitting AT its complexity ceiling, and adding this branch
 * inline pushed it two over.
 */

import { orchestratorRunRiftcarverAdapter } from '../../../adapters/orchestrator/run-riftcarver/orchestrator-run-riftcarver-adapter';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { runRiftcarverInputContract } from '../../../contracts/run-riftcarver-input/run-riftcarver-input-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';

const JSON_INDENT_SPACES = 2;

export const RunRiftcarverLayerResponder = async ({
  args,
}: {
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  const { questId, workItemId } = runRiftcarverInputContract.parse(args);

  try {
    const result = await orchestratorRunRiftcarverAdapter({ questId, workItemId });

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(JSON.stringify(result, null, JSON_INDENT_SPACES)),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(
            JSON.stringify({ success: false, error: errorMessage }, null, JSON_INDENT_SPACES),
          ),
        },
      ],
      isError: true,
    };
  }
};

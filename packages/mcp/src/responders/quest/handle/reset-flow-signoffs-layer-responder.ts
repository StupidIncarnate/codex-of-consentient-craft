/**
 * PURPOSE: Handles the `reset-flow-signoffs` MCP tool call — clears Siegemaster's sign-offs across
 * ONE flow and returns what was cleared as text
 *
 * USAGE:
 * const response = await ResetFlowSignoffsLayerResponder({ args });
 * // Returns ToolResponse carrying the reset report, or the JSON error shape
 *
 * Split out of QuestHandleResponder as a layer, mirroring qa-checklist-layer-responder and
 * blight-checklist-layer-responder: that responder is one long tool switch and adding this branch
 * inline pushed it past the complexity ceiling.
 */

import { orchestratorResetFlowSignoffsAdapter } from '../../../adapters/orchestrator/reset-flow-signoffs/orchestrator-reset-flow-signoffs-adapter';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { resetFlowSignoffsInputContract } from '../../../contracts/reset-flow-signoffs-input/reset-flow-signoffs-input-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';

const JSON_INDENT_SPACES = 2;

export const ResetFlowSignoffsLayerResponder = async ({
  args,
}: {
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  const { questId, workItemId, flowId, reason } = resetFlowSignoffsInputContract.parse(args);

  try {
    const reset = await orchestratorResetFlowSignoffsAdapter({
      questId,
      workItemId,
      flowId,
      reason,
    });

    // The report is already prose. JSON-stringifying it would escape every newline for no gain —
    // the caller is an agent that has to read it and act.
    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(
            reset.success
              ? reset.data
              : JSON.stringify({ success: false, error: reset.error }, null, JSON_INDENT_SPACES),
          ),
        },
      ],
      ...(!reset.success && { isError: true }),
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

/**
 * PURPOSE: Handles the `get-quest-work` MCP tool call — the ONE startup call every LLM step makes,
 * across its two shapes. Split out of QuestHandleResponder as a layer: that responder is one long
 * tool switch and adding this branch inline pushes it past the complexity ceiling.
 *
 * USAGE:
 * const response = await GetQuestWorkLayerResponder({ args });
 * // Returns ToolResponse carrying the view as JSON, or the plan as RAW markdown
 *
 * THE PLAN SHAPE IS RETURNED AS RAW TEXT, never JSON-wrapped. JSON-stringifying already-rendered
 * text escapes every newline and roughly doubles a payload whose whole value is being cheap enough
 * to read.
 *
 * A refusal is NOT caught into a `{ success: false }` body upstream of this layer — the orchestrator
 * responder throws on every refusal. This layer's own try/catch is the ONE place that turns that
 * throw into the MCP protocol's `isError: true` shape, so the message still rides back to the agent.
 */

import { orchestratorGetQuestWorkAdapter } from '../../../adapters/orchestrator/get-quest-work/orchestrator-get-quest-work-adapter';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { getQuestWorkInputContract } from '../../../contracts/get-quest-work-input/get-quest-work-input-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';

const JSON_INDENT_SPACES = 2;

export const GetQuestWorkLayerResponder = async ({
  args,
}: {
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  const { questId, workItemId, operationItemId } = getQuestWorkInputContract.parse(args);

  try {
    const result = await orchestratorGetQuestWorkAdapter({
      questId,
      ...(workItemId !== undefined && { workItemId }),
      ...(operationItemId !== undefined && { operationItemId }),
    });

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(
            result.planText === null
              ? JSON.stringify(result.view, null, JSON_INDENT_SPACES)
              : String(result.planText),
          ),
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

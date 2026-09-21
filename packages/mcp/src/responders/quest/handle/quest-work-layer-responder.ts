/**
 * PURPOSE: Handles the `quest-work` MCP tool call — the single write surface every LLM step calls,
 * across its six payload kinds. Split out of QuestHandleResponder as a layer: that responder is one
 * long tool switch and adding this branch inline pushed it past the complexity ceiling.
 *
 * USAGE:
 * const response = await QuestWorkLayerResponder({ args });
 * // Returns ToolResponse carrying the applied result as JSON, or the JSON error shape
 *
 * Unlike its siblings, a refusal here is NOT caught into a `{ success: false }` JSON body upstream
 * of this layer — `QuestWorkResponder` (orchestrator) throws on every refusal, never returning one.
 * This layer's own try/catch is the ONE place that turns that throw into the MCP protocol's
 * `isError: true` shape, so the message still rides back to the calling agent.
 */

import { orchestratorQuestWorkAdapter } from '../../../adapters/orchestrator/quest-work/orchestrator-quest-work-adapter';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { questWorkInputContract } from '../../../contracts/quest-work-input/quest-work-input-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';

const JSON_INDENT_SPACES = 2;

export const QuestWorkLayerResponder = async ({
  args,
}: {
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  const { questId, workItemId, payload } = questWorkInputContract.parse(args);

  try {
    const result = await orchestratorQuestWorkAdapter({ questId, workItemId, payload });

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

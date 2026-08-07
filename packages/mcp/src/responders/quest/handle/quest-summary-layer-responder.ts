/**
 * PURPOSE: Handles the `get-quest-summary` MCP tool call — renders a quest's whole verification
 * state as text an agent can act on
 *
 * USAGE:
 * const response = await QuestSummaryLayerResponder({ args });
 * // Returns ToolResponse carrying the rendered summary, or the JSON error shape
 *
 * THE ORCHESTRATOR HANDS BACK A STRUCTURE AND THIS RENDERS IT. `QuestGetSummaryResponder` returns
 * `QuestSummary` rather than prose because the web renders the same fields for a person; an agent
 * needs them as instructions. `questSummaryToTextTransformer` is the one renderer, and it travels
 * with the contract in `@dungeonmaster/shared` so the text and the fields cannot drift apart —
 * exactly as `questToTextDisplayTransformer` does for `get-quest`'s text format.
 *
 * Split out of QuestHandleResponder as a layer, mirroring qa-checklist-layer-responder and
 * blight-checklist-layer-responder: that responder is one long tool switch and adding this branch
 * inline pushed it past the complexity ceiling.
 */

import { questSummaryToTextTransformer } from '@dungeonmaster/shared/transformers';

import { orchestratorGetQuestSummaryAdapter } from '../../../adapters/orchestrator/get-quest-summary/orchestrator-get-quest-summary-adapter';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { getQuestSummaryInputContract } from '../../../contracts/get-quest-summary-input/get-quest-summary-input-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';

const JSON_INDENT_SPACES = 2;

export const QuestSummaryLayerResponder = async ({
  args,
}: {
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  const { questId } = getQuestSummaryInputContract.parse(args);

  try {
    const summary = await orchestratorGetQuestSummaryAdapter({ questId });

    // The render is already prose. JSON-stringifying it would escape every newline and roughly
    // double a payload whose whole value is being cheap enough to read in one turn.
    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(questSummaryToTextTransformer({ summary })),
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

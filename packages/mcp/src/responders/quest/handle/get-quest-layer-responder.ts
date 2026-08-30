/**
 * PURPOSE: Handles the `get-quest` MCP tool call — the whole quest, one stage's sections of it, or
 * ONE flow rendered as the slice a session that owns that flow needs.
 *
 * It is a colocated layer rather than a branch inside `QuestHandleResponder` because that function
 * sits at its cyclomatic-complexity ceiling: this body carries three answer shapes and a try/catch,
 * and inlining them costs more than the ceiling has left. `layerResponders` in the parent maps the
 * tool name here at no branch cost.
 *
 * USAGE:
 * await GetQuestLayerResponder({ args: { questId: 'add-auth', flowId: 'login', packageName: 'web' } });
 * // Returns ToolResponse carrying that flow rendered whole for `web`
 */

import { questToTextDisplayTransformer } from '@dungeonmaster/shared/transformers';

import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';
import { questStripCommentsTransformer } from '../../../transformers/quest-strip-comments/quest-strip-comments-transformer';

const JSON_INDENT_SPACES = 2;

export const GetQuestLayerResponder = async ({
  args,
}: {
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  const { questId, stage, flowId, packageName, format } = getQuestInputContract.parse(args);

  try {
    const result = await orchestratorGetQuestAdapter({
      questId,
      ...(stage && { stage }),
      ...(flowId && { flowId }),
      ...(packageName && { packageName }),
    });

    // The flow slice answers BOTH formats, and `format`'s own describe() says so. It exists because
    // the whole-quest render is over `mcpToolResultStatics.maxVerbatimChars` on a real quest, and
    // the JSON payload it would fall back to is larger still — so honouring `format: 'json'` here
    // would hand back exactly the oversized result the slice was asked for instead of.
    if (result.success && result.flowSlice !== undefined) {
      return { content: [{ type: 'text', text: result.flowSlice }] };
    }

    if (format === 'text' && result.success && result.quest) {
      // questToTextDisplayTransformer never reads quest.comments — no section renders them — so the
      // text branch does not need the strip below. It also takes a full Quest, which the stripped
      // payload the JSON branch builds deliberately is not.
      return {
        content: [
          {
            type: 'text',
            // Thread the stage through: it is what lets the renderer omit sections this stage
            // filtered out instead of printing them as an empty "(none)" section.
            text: questToTextDisplayTransformer({
              quest: result.quest,
              ...(stage && { stage }),
            }),
          },
        ],
      };
    }

    // Strip comments before this reaches an agent: a comment is a record for the user, meant to be
    // seen exactly once as the markdown turn the comment-batch route delivers, never again via
    // get-quest.
    const agentPayload = questStripCommentsTransformer({ result });
    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(JSON.stringify(agentPayload, null, JSON_INDENT_SPACES)),
        },
      ],
      ...(!result.success && { isError: true }),
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

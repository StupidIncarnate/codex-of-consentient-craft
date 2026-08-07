/**
 * PURPOSE: Handles the `get-qa-checklist` MCP tool call — returns a quest's deterministically
 * enumerated QA surface as text
 *
 * USAGE:
 * const response = await QaChecklistLayerResponder({ args });
 * // Returns ToolResponse carrying the rendered checklist, or the JSON error shape
 *
 * Split out of QuestHandleResponder as a layer: that responder is one long tool switch and adding
 * this branch inline pushed it past the complexity ceiling.
 */

import { orchestratorGetQaChecklistAdapter } from '../../../adapters/orchestrator/get-qa-checklist/orchestrator-get-qa-checklist-adapter';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { getQaChecklistInputContract } from '../../../contracts/get-qa-checklist-input/get-qa-checklist-input-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';

const JSON_INDENT_SPACES = 2;

export const QaChecklistLayerResponder = async ({
  args,
}: {
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  const { questId, flowId, track } = getQaChecklistInputContract.parse(args);

  try {
    const checklist = await orchestratorGetQaChecklistAdapter({
      questId,
      ...(flowId !== undefined && { flowId }),
      ...(track !== undefined && { track }),
    });

    // The checklist is already rendered text. JSON-stringifying it would escape every newline and
    // roughly double a payload whose whole value is being cheap enough to read per flow.
    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(
            checklist.success
              ? checklist.data
              : JSON.stringify(
                  { success: false, error: checklist.error },
                  null,
                  JSON_INDENT_SPACES,
                ),
          ),
        },
      ],
      ...(!checklist.success && { isError: true }),
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

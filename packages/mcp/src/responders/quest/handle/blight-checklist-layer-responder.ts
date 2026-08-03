/**
 * PURPOSE: Handles the `get-blight-checklist` MCP tool call — returns a quest's deterministically
 * enumerated whole-diff blight review surface as text
 *
 * USAGE:
 * const response = await BlightChecklistLayerResponder({ args });
 * // Returns ToolResponse carrying the rendered checklist, or the JSON error shape
 *
 * Split out of QuestHandleResponder as a layer, mirroring qa-checklist-layer-responder: that
 * responder is one long tool switch and adding this branch inline pushed it past the complexity
 * ceiling.
 */

import { orchestratorGetBlightChecklistAdapter } from '../../../adapters/orchestrator/get-blight-checklist/orchestrator-get-blight-checklist-adapter';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { getBlightChecklistInputContract } from '../../../contracts/get-blight-checklist-input/get-blight-checklist-input-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';

const JSON_INDENT_SPACES = 2;

export const BlightChecklistLayerResponder = async ({
  args,
}: {
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  const { questId } = getBlightChecklistInputContract.parse(args);

  try {
    const checklist = await orchestratorGetBlightChecklistAdapter({ questId });

    // The checklist is already rendered text. JSON-stringifying it would escape every newline and
    // roughly double a payload whose whole value is being cheap enough to read per session.
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

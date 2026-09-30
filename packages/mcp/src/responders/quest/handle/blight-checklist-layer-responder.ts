/**
 * PURPOSE: Handles the `get-blight-checklist` MCP tool call — returns a quest's deterministically
 * enumerated whole-diff blight review surface as text
 *
 * USAGE:
 * const response = await BlightChecklistLayerResponder({ args });
 * // Returns CallToolResult carrying the rendered checklist, or the JSON error shape
 *
 * Split out of QuestHandleResponder as a layer, mirroring its other colocated layer responders:
 * that responder is one long tool switch and adding this branch inline pushed it past the
 * complexity ceiling.
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { getBlightChecklistInputContract } from '../../../contracts/get-blight-checklist-input/get-blight-checklist-input-contract';
import type { CallToolResult } from '#gateway/npm/modelcontextprotocol__sdk__types';

const JSON_INDENT_SPACES = 2;

export const BlightChecklistLayerResponder = async ({
  args,
}: {
  args: Record<string, unknown>;
}): Promise<CallToolResult> => {
  const { questId, scope } = getBlightChecklistInputContract.parse(args);

  try {
    const checklist = await StartOrchestrator.getBlightChecklist({
      questId,
      ...(scope !== undefined && { scope }),
    });

    // The checklist is already rendered text. JSON-stringifying it would escape every newline and
    // roughly double a payload whose whole value is being cheap enough to read per session.
    return {
      content: [
        {
          type: 'text',
          text: (checklist.success
              ? checklist.data
              : JSON.stringify(
                  { success: false, error: checklist.error },
                  null,
                  JSON_INDENT_SPACES,
                )),
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
          text: JSON.stringify({ success: false, error: errorMessage }, null, JSON_INDENT_SPACES),
        },
      ],
      isError: true,
    };
  }
};

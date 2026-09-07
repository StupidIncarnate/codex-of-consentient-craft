/**
 * PURPOSE: Handles the `create-worktree` MCP tool call — hands a session the one path it is allowed
 * to work in, so no caller ever assembles a `git worktree add` of its own.
 *
 * USAGE:
 * const response = await CreateWorktreeLayerResponder({ args });
 * // Returns ToolResponse carrying { path }, or the JSON error shape
 *
 * Split out of QuestHandleResponder as a layer, mirroring run-riftcarver-layer-responder: that
 * responder is one long tool switch sitting AT its complexity ceiling, and adding this branch
 * inline pushed it over.
 */

import { orchestratorCreateWorktreeAdapter } from '../../../adapters/orchestrator/create-worktree/orchestrator-create-worktree-adapter';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { createWorktreeInputContract } from '../../../contracts/create-worktree-input/create-worktree-input-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';

const JSON_INDENT_SPACES = 2;

export const CreateWorktreeLayerResponder = async ({
  args,
}: {
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  const { name } = createWorktreeInputContract.parse(args);

  try {
    const { worktreePath } = await orchestratorCreateWorktreeAdapter({ name });

    // `path`, not `worktreePath`: the caller asked for somewhere to work, and the answer is the one
    // value it needs to pass to every command it runs next.
    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(
            JSON.stringify({ path: worktreePath }, null, JSON_INDENT_SPACES),
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

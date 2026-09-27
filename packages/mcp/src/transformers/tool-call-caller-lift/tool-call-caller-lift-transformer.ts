/**
 * PURPOSE: Moves the caller context the pre-MCP-caller hook stamped onto a tool call's arguments
 *   into the call's `meta`. Runs once, where the MCP server receives the call, so no tool's own
 *   input contract ever sees the extra key — several of them are strict and would reject it — and
 *   every handler finds the caller beside Claude Code's own `_meta` entries. A caller value that
 *   does not parse is dropped from the arguments all the same and never reaches `meta`, so the
 *   resolvers fall back exactly as they do when no hook ran.
 *
 * USAGE:
 * const { args, meta } = toolCallCallerLiftTransformer({ args: request.params.arguments, meta: request.params._meta });
 * // Returns the args without `dungeonmasterCaller`, and meta with `dungeonmaster/caller` added
 */
import { mcpCallerContextContract } from '@dungeonmaster/shared/contracts';
import { mcpCallerContextStatics } from '@dungeonmaster/shared/statics';

import {
  toolCallParamsContract,
  type ToolCallParams,
} from '../../contracts/tool-call-params/tool-call-params-contract';

export const toolCallCallerLiftTransformer = ({
  args,
  meta,
}: {
  args: Record<string, unknown>;
  meta?: Record<string, unknown>;
}): ToolCallParams => {
  const { [mcpCallerContextStatics.keys.argument]: callerRaw, ...toolArgs } = args;
  const caller = mcpCallerContextContract.safeParse(callerRaw);

  if (caller.success) {
    return toolCallParamsContract.parse({
      args: toolArgs,
      meta: { ...meta, [mcpCallerContextStatics.keys.meta]: caller.data },
    });
  }

  return toolCallParamsContract.parse({
    args: toolArgs,
    ...(meta !== undefined && { meta }),
  });
};

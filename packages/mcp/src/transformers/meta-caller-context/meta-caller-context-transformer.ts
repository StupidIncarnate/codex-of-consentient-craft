/**
 * PURPOSE: Reads the caller context out of a tool call's `meta`, where toolCallCallerLiftTransformer
 *   put it. Reach for this first when a handler needs the caller's cwd, session or sub-agent id;
 *   undefined means no pre-MCP-caller hook ran (a repo whose hooks predate it, or a client other
 *   than Claude Code), and only then is a transcript scan worth its cost.
 *
 * USAGE:
 * const caller = metaCallerContextTransformer({ meta });
 * // Returns McpCallerContext, or undefined when meta carries none
 */
import { mcpCallerContextContract, type McpCallerContext } from '@dungeonmaster/shared/contracts';
import { mcpCallerContextStatics } from '@dungeonmaster/shared/statics';

export const metaCallerContextTransformer = ({
  meta,
}: {
  meta: Record<string, unknown> | undefined;
}): McpCallerContext | undefined => {
  const parsed = mcpCallerContextContract.safeParse(meta?.[mcpCallerContextStatics.keys.meta]);

  return parsed.success ? parsed.data : undefined;
};

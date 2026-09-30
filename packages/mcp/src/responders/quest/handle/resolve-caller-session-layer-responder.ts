/**
 * PURPOSE: Layer of QuestHandleResponder — resolves the Claude Code session id of the `create-quest`
 * caller, so the intake work item the new quest seeds is stamped with the session the user is
 * actually talking to and the browser chat panel hooks up to it.
 *
 * USAGE:
 * const sessionId = ResolveCallerSessionLayerResponder({ meta });
 * // Returns the caller's SessionId, or undefined when the pre-MCP-caller hook stamped none.
 *
 * The `dungeonmaster-pre-mcp-caller` PreToolUse hook stamps the caller's session id onto every MCP
 * call before it reaches this process; `metaCallerContextTransformer` reads it back off `meta`.
 * Undefined means the call carries no hook-stamped caller — a repo whose hooks predate it, or a
 * client other than Claude Code — and the quest's intake work item goes unstamped.
 */

import type { Session } from '@dungeonmaster/shared/contracts';

import { metaCallerContextTransformer } from '../../../transformers/meta-caller-context/meta-caller-context-transformer';

export const ResolveCallerSessionLayerResponder = ({
  meta,
}: {
  // An explicit `| undefined` union rather than an optional key: under exactOptionalPropertyTypes
  // the caller can then forward its own possibly-absent `meta` as `{ meta }` directly, instead of
  // guarding the property into existence with a conditional spread at the call site.
  meta: Record<string, unknown> | undefined;
}): Session['id'] | undefined => metaCallerContextTransformer({ meta })?.sessionId;

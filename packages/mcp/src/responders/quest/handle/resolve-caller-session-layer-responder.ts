/**
 * PURPOSE: Layer of QuestHandleResponder — resolves the Claude Code session id of the `create-quest`
 * caller, so the intake work item the new quest seeds is stamped with the session the user is
 * actually talking to and the browser chat panel hooks up to it.
 *
 * USAGE:
 * const sessionId = await ResolveCallerSessionLayerResponder({ meta });
 * // Returns the caller's SessionId, or undefined when neither strategy identifies one.
 *
 * Three strategies, in order:
 *  0. HOOK — the session id the pre-MCP-caller hook stamped onto the call, read off `meta`. Exact,
 *     and written before the call is sent, so it needs no scan at all. The two below run only when
 *     no hook ran.
 *  1. DETERMINISTIC — `_meta['claudecode/toolUseId']` scanned against every top-level
 *     `<sessionId>.jsonl` in this cwd. The intake agent runs inline in the user's own session, so
 *     the session's JSONL records the very `create-quest` tool_use being handled. Exact even with
 *     several Claude sessions open in the same repo.
 *  2. NEWEST-MTIME fallback — used only when the metadata is absent or the tool_use line never
 *     lands within the scan budget. Correct in the common single-session case (the user just typed
 *     the slash command, so their JSONL is necessarily the newest) but it races any other Claude
 *     session writing in the same cwd, which is exactly what strategy 1 removes.
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';

import { claudeCodeSessionFindByToolUseIdBroker } from '../../../brokers/claude-code-session/find-by-tool-use-id/claude-code-session-find-by-tool-use-id-broker';
import { claudeCodeSessionResolveBroker } from '../../../brokers/claude-code-session/resolve/claude-code-session-resolve-broker';
import { toolUseIdContract } from '../../../contracts/tool-use-id/tool-use-id-contract';
import { metaCallerContextTransformer } from '../../../transformers/meta-caller-context/meta-caller-context-transformer';

const TOOL_USE_ID_META_KEY = 'claudecode/toolUseId';

export const ResolveCallerSessionLayerResponder = async ({
  meta,
}: {
  // An explicit `| undefined` union rather than an optional key: under exactOptionalPropertyTypes
  // the caller can then forward its own possibly-absent `meta` as `{ meta }` directly, instead of
  // guarding the property into existence with a conditional spread at the call site.
  meta: Record<string, unknown> | undefined;
}): Promise<SessionId | undefined> => {
  const caller = metaCallerContextTransformer({ meta });
  if (caller !== undefined) {
    return caller.sessionId;
  }

  const cwd = processCwdAdapter();
  const projectDir: AbsoluteFilePath = absoluteFilePathContract.parse(String(cwd));

  const toolUseIdRaw = meta?.[TOOL_USE_ID_META_KEY];
  const parsedToolUseId =
    typeof toolUseIdRaw === 'string' ? toolUseIdContract.safeParse(toolUseIdRaw) : undefined;

  if (parsedToolUseId?.success === true) {
    const exact = await claudeCodeSessionFindByToolUseIdBroker({
      projectDir,
      toolUseId: parsedToolUseId.data,
    });
    if (exact !== undefined) {
      return exact;
    }
  }

  const resolved = await claudeCodeSessionResolveBroker({ projectDir });
  return resolved?.sessionId;
};

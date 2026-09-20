/**
 * PURPOSE: The WARM path for resolving a caller's cwd — checks callerCwdScanCursorState's
 * already-cached files before claudeCodeCallerCwdFindByToolUseIdBroker's cold, full-directory
 * scan runs at all. For each cached cursor (most-recently-used first), reads only the bytes
 * APPENDED since that cursor's offset and scans just that delta for the requested toolUseId —
 * never the whole file, and never a remembered answer. Reading fresh bytes every call (rather
 * than memoizing a resolved cwd) is what lets a cwd change mid-session — a session moving from
 * the main checkout into a worktree, exactly as happened in the session that motivated this fix —
 * show up on the very next call instead of being served stale. Returns every cursor that grew
 * during the check (`advancedEntries`) whether or not it matched, so the caller can persist those
 * offsets and avoid re-scanning the same non-matching bytes on the next lookup.
 *
 * USAGE:
 * const { cwd, advancedEntries } = await claudeCodeCallerCwdScanCachedEntriesBroker({
 *   entries: callerCwdScanCursorState.getAll(),
 *   toolUseId,
 * });
 * // cwd is the matched AbsoluteFilePath, or undefined when nothing cached grew into a match
 */

import { absoluteFilePathContract, pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { claudeCodeToolUseScanLineContract } from '../../../contracts/claude-code-tool-use-scan-line/claude-code-tool-use-scan-line-contract';
import { callerCwdScanCursorContract } from '../../../contracts/caller-cwd-scan-cursor/caller-cwd-scan-cursor-contract';
import type { CallerCwdScanCursor } from '../../../contracts/caller-cwd-scan-cursor/caller-cwd-scan-cursor-contract';
import type { ToolUseId } from '../../../contracts/tool-use-id/tool-use-id-contract';

const TOOL_USE_TYPE_TOKEN = '"type":"tool_use"';

export const claudeCodeCallerCwdScanCachedEntriesBroker = async ({
  entries,
  toolUseId,
}: {
  entries: readonly CallerCwdScanCursor[];
  toolUseId: ToolUseId;
}): Promise<{
  cwd: AbsoluteFilePath | undefined;
  advancedEntries: readonly CallerCwdScanCursor[];
}> => {
  const [entry, ...restEntries] = entries;
  if (entry === undefined) {
    return { cwd: undefined, advancedEntries: [] };
  }

  const toolUseIdString = String(toolUseId);
  const toolUseIdToken = `"id":"${toolUseIdString}"`;
  const filepath = pathSegmentContract.parse(String(entry.filepath));

  const stat = await fsStatAdapter({ filepath });
  if (stat.size <= Number(entry.offsetBytes)) {
    // No growth since the cursor — nothing new to check, cursor unchanged, try the next entry.
    return claudeCodeCallerCwdScanCachedEntriesBroker({ entries: restEntries, toolUseId });
  }

  const contents = String(await fsReadFileAdapter({ filepath }));
  const advancedEntry = callerCwdScanCursorContract.parse({
    filepath: entry.filepath,
    offsetBytes: contents.length,
  });
  const delta = contents.slice(Number(entry.offsetBytes));
  const deltaLines = delta.includes(toolUseIdToken) ? delta.split('\n') : [];

  const matchedCwd = deltaLines.reduce<AbsoluteFilePath | undefined>((found, line) => {
    if (found !== undefined) return found;
    if (!line.includes(TOOL_USE_TYPE_TOKEN)) return found;
    if (!line.includes(toolUseIdToken)) return found;
    const parsed = claudeCodeToolUseScanLineContract.safeParse(JSON.parse(line));
    if (!parsed.success) return found;
    const content = parsed.data.message?.content ?? [];
    const hit = content.some(
      (item) => String(item.type) === 'tool_use' && String(item.id) === toolUseIdString,
    );
    if (!hit || parsed.data.cwd === undefined) return found;
    return absoluteFilePathContract.parse(parsed.data.cwd);
  }, undefined);

  if (matchedCwd !== undefined) {
    return { cwd: matchedCwd, advancedEntries: [advancedEntry] };
  }

  const rest = await claudeCodeCallerCwdScanCachedEntriesBroker({
    entries: restEntries,
    toolUseId,
  });
  return { cwd: rest.cwd, advancedEntries: [advancedEntry, ...rest.advancedEntries] };
};

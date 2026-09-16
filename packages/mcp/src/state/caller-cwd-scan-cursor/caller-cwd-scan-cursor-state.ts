/**
 * PURPOSE: In-memory, per-MCP-child cache of how far each session/sub-agent JSONL file has
 * already been scanned for a caller's cwd — a CURSOR (byte offset), never a resolved cwd, so a
 * warm lookup rereads only the bytes appended since the last call and a cwd change (a session
 * moving into a worktree mid-session) shows up the moment it is written rather than being served
 * stale. Bounded to callerCwdScanCursorStatics.limits.maxEntries with least-recently-used
 * eviction, keyed by absolute filepath, ordered by recency of `set`.
 *
 * USAGE:
 * callerCwdScanCursorState.set({ cursor });
 * const entries = callerCwdScanCursorState.getAll(); // most-recently-used first
 * callerCwdScanCursorState.clear();
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { callerCwdScanCursorContract } from '../../contracts/caller-cwd-scan-cursor/caller-cwd-scan-cursor-contract';
import type { CallerCwdScanCursor } from '../../contracts/caller-cwd-scan-cursor/caller-cwd-scan-cursor-contract';
import { callerCwdScanCursorStatics } from '../../statics/caller-cwd-scan-cursor/caller-cwd-scan-cursor-statics';

// A Map preserves insertion order, so re-inserting a key on every `set` keeps the map ordered
// oldest-to-newest — the first key is always the least-recently-used one to evict.
const cursors = new Map<AbsoluteFilePath, CallerCwdScanCursor>();

export const callerCwdScanCursorState = {
  getAll: (): readonly CallerCwdScanCursor[] => [...cursors.values()].reverse(),

  set: ({ cursor }: { cursor: CallerCwdScanCursor }): void => {
    const parsed = callerCwdScanCursorContract.parse(cursor);
    cursors.delete(parsed.filepath);
    cursors.set(parsed.filepath, parsed);

    if (cursors.size > callerCwdScanCursorStatics.limits.maxEntries) {
      const [leastRecentlyUsedKey] = cursors.keys();
      if (leastRecentlyUsedKey !== undefined) {
        cursors.delete(leastRecentlyUsedKey);
      }
    }
  },

  clear: (): void => {
    cursors.clear();
  },
} as const;

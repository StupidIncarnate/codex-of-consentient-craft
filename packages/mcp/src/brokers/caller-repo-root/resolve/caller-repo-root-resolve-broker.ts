/**
 * PURPOSE: Resolves the dungeonmaster project root for an MCP tool call FROM THE CALLER'S OWN
 * location, not the MCP server's — walking up from that location to the first `.dungeonmaster.json`
 * (via cwdResolveBroker's `repo-root` kind), which stops there rather than climbing into an
 * enclosing checkout that a worktree happens to live under. The caller's location comes from a
 * JSONL scan keyed on `_meta['claudecode/toolUseId']` — the only channel that carries a
 * Task-dispatched sub-agent's real, possibly worktree-pinned, cwd, since the MCP stdio child is
 * shared by every sub-agent in a session and its own `process.cwd()` never moves. `cachedEntries`
 * (read from callerCwdScanCursorState by the caller — a broker cannot import `state/`) is tried
 * FIRST via claudeCodeCallerCwdScanCachedEntriesBroker's warm, delta-only read; only on a cache
 * miss does claudeCodeCallerCwdFindByToolUseIdBroker's cold, full-directory scan run at all.
 * `cursorUpdates` carries every cursor advance this call produced, whether or not it matched, so
 * the caller can persist them and keep the next lookup warm.
 *
 * When the scan finds nothing (no `_meta`, an unparseable toolUseId, or the JSONL flush race
 * outlives the retry budget) this broker falls back to the server's own cwd — the identical
 * resolution the tools used before this fix — and reports the fallback in `source` so the caller
 * can see it happened, instead of silently repeating the "worktree comes back empty" bug this
 * broker exists to fix. Either starting point (caller cwd or server cwd) can also have NO
 * `.dungeonmaster.json` anywhere above it (a scratch dir, a repo never `dungeonmaster init`-ed) —
 * cwdResolveBroker rejects with ProjectRootNotFoundError there, and this broker falls back to the
 * literal starting path as the root (mirroring the same catch already established in
 * questMcpCreateBroker) while marking that in `configFound: false`, so the banner can say a config
 * walk-up gave up rather than silently claiming a clean "resolved from the caller's own working
 * directory".
 *
 * USAGE:
 * const { repoRoot, source, configFound, cursorUpdates } = await callerRepoRootResolveBroker({
 *   meta,
 *   cachedEntries: callerCwdScanCursorState.getAll(),
 * });
 */

import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  absoluteFilePathContract,
  filePathContract,
  repoRootCwdContract,
  type RepoRootCwd,
} from '@dungeonmaster/shared/contracts';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { ProjectRootNotFoundError } from '@dungeonmaster/shared/errors';

import { claudeCodeCallerCwdFindByToolUseIdBroker } from '../../claude-code-caller-cwd/find-by-tool-use-id/claude-code-caller-cwd-find-by-tool-use-id-broker';
import { claudeCodeCallerCwdScanCachedEntriesBroker } from '../../claude-code-caller-cwd/scan-cached-entries/claude-code-caller-cwd-scan-cached-entries-broker';
import { callerRepoRootSourceContract } from '../../../contracts/caller-repo-root-source/caller-repo-root-source-contract';
import type { CallerRepoRootSource } from '../../../contracts/caller-repo-root-source/caller-repo-root-source-contract';
import type { CallerCwdScanCursor } from '../../../contracts/caller-cwd-scan-cursor/caller-cwd-scan-cursor-contract';
import { toolUseIdContract } from '../../../contracts/tool-use-id/tool-use-id-contract';

const TOOL_USE_ID_META_KEY = 'claudecode/toolUseId';

export const callerRepoRootResolveBroker = async ({
  meta,
  cachedEntries,
}: {
  // An explicit `| undefined` union rather than an optional key: under exactOptionalPropertyTypes
  // the caller can then forward its own possibly-absent `meta` as `{ meta }` directly.
  meta: Record<string, unknown> | undefined;
  cachedEntries: readonly CallerCwdScanCursor[];
}): Promise<{
  repoRoot: RepoRootCwd;
  source: CallerRepoRootSource;
  configFound: boolean;
  cursorUpdates: readonly CallerCwdScanCursor[];
}> => {
  const serverCwd = processCwdAdapter();

  const toolUseIdRaw = meta?.[TOOL_USE_ID_META_KEY];
  const parsedToolUseId =
    typeof toolUseIdRaw === 'string' ? toolUseIdContract.safeParse(toolUseIdRaw) : undefined;

  if (parsedToolUseId?.success === true) {
    const cached = await claudeCodeCallerCwdScanCachedEntriesBroker({
      entries: cachedEntries,
      toolUseId: parsedToolUseId.data,
    });
    if (cached.cwd !== undefined) {
      try {
        const repoRoot = await cwdResolveBroker({
          startPath: filePathContract.parse(String(cached.cwd)),
          kind: 'repo-root',
        });
        return {
          repoRoot,
          source: callerRepoRootSourceContract.parse('caller-cwd'),
          configFound: true,
          cursorUpdates: cached.advancedEntries,
        };
      } catch (error) {
        if (!(error instanceof ProjectRootNotFoundError)) {
          throw error;
        }
        return {
          repoRoot: repoRootCwdContract.parse(cached.cwd),
          source: callerRepoRootSourceContract.parse('caller-cwd'),
          configFound: false,
          cursorUpdates: cached.advancedEntries,
        };
      }
    }

    const cold = await claudeCodeCallerCwdFindByToolUseIdBroker({
      projectDir: absoluteFilePathContract.parse(String(serverCwd)),
      toolUseId: parsedToolUseId.data,
    });
    if (cold !== undefined) {
      try {
        const repoRoot = await cwdResolveBroker({
          startPath: filePathContract.parse(String(cold.cwd)),
          kind: 'repo-root',
        });
        return {
          repoRoot,
          source: callerRepoRootSourceContract.parse('caller-cwd'),
          configFound: true,
          cursorUpdates: [...cached.advancedEntries, cold.cursor],
        };
      } catch (error) {
        if (!(error instanceof ProjectRootNotFoundError)) {
          throw error;
        }
        return {
          repoRoot: repoRootCwdContract.parse(cold.cwd),
          source: callerRepoRootSourceContract.parse('caller-cwd'),
          configFound: false,
          cursorUpdates: [...cached.advancedEntries, cold.cursor],
        };
      }
    }

    try {
      const repoRoot = await cwdResolveBroker({ startPath: serverCwd, kind: 'repo-root' });
      return {
        repoRoot,
        source: callerRepoRootSourceContract.parse('server-cwd-fallback'),
        configFound: true,
        cursorUpdates: cached.advancedEntries,
      };
    } catch (error) {
      if (!(error instanceof ProjectRootNotFoundError)) {
        throw error;
      }
      return {
        repoRoot: repoRootCwdContract.parse(serverCwd),
        source: callerRepoRootSourceContract.parse('server-cwd-fallback'),
        configFound: false,
        cursorUpdates: cached.advancedEntries,
      };
    }
  }

  try {
    const repoRoot = await cwdResolveBroker({ startPath: serverCwd, kind: 'repo-root' });
    return {
      repoRoot,
      source: callerRepoRootSourceContract.parse('server-cwd-fallback'),
      configFound: true,
      cursorUpdates: [],
    };
  } catch (error) {
    if (!(error instanceof ProjectRootNotFoundError)) {
      throw error;
    }
    return {
      repoRoot: repoRootCwdContract.parse(serverCwd),
      source: callerRepoRootSourceContract.parse('server-cwd-fallback'),
      configFound: false,
      cursorUpdates: [],
    };
  }
};

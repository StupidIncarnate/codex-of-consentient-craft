/**
 * PURPOSE: Resolves the dungeonmaster project root for an MCP tool call FROM THE CALLER'S OWN
 * location, not the MCP server's — walking up from that location to the first `.dungeonmaster.json`
 * (via cwdResolveBroker's `repo-root` kind), which stops there rather than climbing into an
 * enclosing checkout that a worktree happens to live under. The caller's location comes from the
 * caller context the dungeonmaster-pre-mcp-caller hook stamps onto every call (read off `meta` by
 * metaCallerContextTransformer): the hook runs before the call is sent, so this answer is exact and
 * costs nothing.
 *
 * When the hook supplied no caller (a repo whose settings predate the hook, or a client other than
 * Claude Code) this broker falls back to the server's own cwd — the MCP stdio child's own
 * working directory (passed in by the responder), shared by every sub-agent in a session and never moved by any one of them — and
 * reports the fallback in `source` so the caller can see it happened, instead of silently repeating
 * the "worktree comes back empty" bug this broker exists to fix.
 *
 * Either starting point (caller cwd or server cwd) can also have NO `.dungeonmaster.json` anywhere
 * above it (a scratch dir, a repo never `dungeonmaster init`-ed) — cwdResolveBroker rejects with
 * ProjectRootNotFoundError there, and this broker falls back to the literal starting path as the
 * root (mirroring the same catch already established in questMcpCreateBroker) while marking that in
 * `configFound: false`, so the banner can say a config walk-up gave up rather than silently claiming
 * a clean "resolved from the caller's own working directory".
 *
 * USAGE:
 * const { repoRoot, source, configFound } = await callerRepoRootResolveBroker({ meta, serverCwd });
 */

import { callerRepoRootResolveResultContract } from '../../../contracts/caller-repo-root-resolve-result/caller-repo-root-resolve-result-contract';
import type { CallerRepoRootResolveResult } from '../../../contracts/caller-repo-root-resolve-result/caller-repo-root-resolve-result-contract';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { ProjectRootNotFoundError } from '@dungeonmaster/shared/errors';

import { metaCallerContextTransformer } from '../../../transformers/meta-caller-context/meta-caller-context-transformer';

export const callerRepoRootResolveBroker = async ({
  meta,
  serverCwd,
}: {
  meta: Record<string, unknown> | undefined;
  // The MCP server's own working directory, read by the calling responder; the start path when the
  // hook stamped no caller.
  serverCwd: string;
}): Promise<CallerRepoRootResolveResult> => {
  const caller = metaCallerContextTransformer({ meta });

  if (caller !== undefined) {
    try {
      const repoRoot = await cwdResolveBroker({
        startPath: String(caller.cwd),
        kind: 'repo-root',
      });
      return callerRepoRootResolveResultContract.parse({
        repoRoot,
        source: 'caller-cwd',
        configFound: true,
      });
    } catch (error) {
      if (!(error instanceof ProjectRootNotFoundError)) {
        throw error;
      }
      return callerRepoRootResolveResultContract.parse({
        repoRoot: caller.cwd,
        source: 'caller-cwd',
        configFound: false,
      });
    }
  }

  try {
    const repoRoot = await cwdResolveBroker({ startPath: serverCwd, kind: 'repo-root' });
    return callerRepoRootResolveResultContract.parse({
      repoRoot,
      source: 'server-cwd-fallback',
      configFound: true,
    });
  } catch (error) {
    if (!(error instanceof ProjectRootNotFoundError)) {
      throw error;
    }
    return callerRepoRootResolveResultContract.parse({
      repoRoot: serverCwd,
      source: 'server-cwd-fallback',
      configFound: false,
    });
  }
};

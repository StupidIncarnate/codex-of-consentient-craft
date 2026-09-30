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
 * `process.cwd()`, shared by every sub-agent in a session and never moved by any one of them — and
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
 * const { repoRoot, source, configFound } = await callerRepoRootResolveBroker({ meta });
 */

import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { repoRootCwdContract, type RepoRootCwd } from '@dungeonmaster/shared/contracts';
import { cwd } from '#gateway/node/process';
import { ProjectRootNotFoundError } from '@dungeonmaster/shared/errors';

import { callerRepoRootSourceContract } from '../../../contracts/caller-repo-root-source/caller-repo-root-source-contract';
import type { CallerRepoRootSource } from '../../../contracts/caller-repo-root-source/caller-repo-root-source-contract';
import { metaCallerContextTransformer } from '../../../transformers/meta-caller-context/meta-caller-context-transformer';

export const callerRepoRootResolveBroker = async ({
  meta,
}: {
  meta: Record<string, unknown> | undefined;
}): Promise<{
  repoRoot: RepoRootCwd;
  source: CallerRepoRootSource;
  configFound: boolean;
}> => {
  const caller = metaCallerContextTransformer({ meta });

  if (caller !== undefined) {
    try {
      const repoRoot = await cwdResolveBroker({
        startPath: String(caller.cwd),
        kind: 'repo-root',
      });
      return {
        repoRoot,
        source: callerRepoRootSourceContract.parse('caller-cwd'),
        configFound: true,
      };
    } catch (error) {
      if (!(error instanceof ProjectRootNotFoundError)) {
        throw error;
      }
      return {
        repoRoot: repoRootCwdContract.parse(caller.cwd),
        source: callerRepoRootSourceContract.parse('caller-cwd'),
        configFound: false,
      };
    }
  }

  const serverCwd = cwd();
  try {
    const repoRoot = await cwdResolveBroker({ startPath: serverCwd, kind: 'repo-root' });
    return {
      repoRoot,
      source: callerRepoRootSourceContract.parse('server-cwd-fallback'),
      configFound: true,
    };
  } catch (error) {
    if (!(error instanceof ProjectRootNotFoundError)) {
      throw error;
    }
    return {
      repoRoot: repoRootCwdContract.parse(serverCwd),
      source: callerRepoRootSourceContract.parse('server-cwd-fallback'),
      configFound: false,
    };
  }
};

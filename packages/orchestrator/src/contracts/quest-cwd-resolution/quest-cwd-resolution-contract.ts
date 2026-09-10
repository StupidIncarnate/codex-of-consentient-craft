/**
 * PURPOSE: The single resolved shape every quest-scoped spawn (agent, ward run, chat session)
 * reads its cwd from, replacing the guild-path-derived fallback duplicated across call sites
 * with a discriminated read of the quest's own recorded worktree state.
 *
 * USAGE:
 * questCwdResolutionContract.parse({ kind: 'session', cwd: repoRootCwdContract.parse('/repo') });
 * questCwdResolutionContract.parse({ kind: 'worktree', cwd: repoRootCwdContract.parse('/repo/worktrees/quest-1') });
 * questCwdResolutionContract.parse({ kind: 'repo-root', cwd: repoRootCwdContract.parse('/repo') });
 * questCwdResolutionContract.parse({ kind: 'missing-worktree', worktreePath: absoluteFilePathContract.parse('/repo/worktrees/quest-1') });
 * // Returns: QuestCwdResolution variant
 *
 * Three of the four carry a `cwd`, so a caller that has narrowed out `missing-worktree` reads the
 * field without discriminating further.
 */

import { z } from 'zod';

import { absoluteFilePathContract, repoRootCwdContract } from '@dungeonmaster/shared/contracts';

export const questCwdResolutionContract = z.discriminatedUnion('kind', [
  // The cwd this SESSION was recorded running in, read off the quest's `sessions` ledger. It
  // outranks both derived kinds because it is measured rather than inferred, and it is served
  // WITHOUT the worktree accessibility probe the `worktree` kind pays for: a transcript lives under
  // `~/.claude/projects/`, so it outlives the directory it was written from.
  z.object({
    kind: z.literal('session'),
    cwd: repoRootCwdContract,
  }),
  z.object({
    kind: z.literal('worktree'),
    cwd: repoRootCwdContract,
  }),
  z.object({
    kind: z.literal('repo-root'),
    cwd: repoRootCwdContract,
  }),
  z.object({
    kind: z.literal('missing-worktree'),
    worktreePath: absoluteFilePathContract,
  }),
]);

export type QuestCwdResolution = z.infer<typeof questCwdResolutionContract>;

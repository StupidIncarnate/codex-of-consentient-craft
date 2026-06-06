/**
 * PURPOSE: Predicate deciding whether a registered guild "covers" a resolved repo root — true when the guild's path equals the repo root OR is an ancestor directory of it, after trailing-slash normalization. Used by the create-quest auto-create branch to reuse an ancestor guild instead of minting a duplicate.
 *
 * USAGE:
 * guildCoversRepoRootGuard({ guild, repoRoot });
 * // Returns true when guild.path === repoRoot or repoRoot is a descendant of guild.path
 */

import type { Guild, RepoRootCwd } from '@dungeonmaster/shared/contracts';

import { stripTrailingSlashTransformer } from '../../transformers/strip-trailing-slash/strip-trailing-slash-transformer';

export const guildCoversRepoRootGuard = ({
  guild,
  repoRoot,
}: {
  guild?: Guild;
  repoRoot?: RepoRootCwd;
}): boolean => {
  if (!guild || !repoRoot) {
    return false;
  }

  const normalizedGuildPath = stripTrailingSlashTransformer({ path: guild.path });
  const normalizedRepoRoot = stripTrailingSlashTransformer({ path: repoRoot });

  if (normalizedGuildPath === normalizedRepoRoot) {
    return true;
  }

  return normalizedRepoRoot.startsWith(`${normalizedGuildPath}/`);
};

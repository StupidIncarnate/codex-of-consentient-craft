/**
 * PURPOSE: Resolves a startPath into a typed cwd branded contract — repo root, project root, guild path, or dungeonmaster home
 *
 * USAGE:
 * const repoRoot = await cwdResolveBroker({ startPath, kind: 'repo-root' });
 * // Returns RepoRootCwd — directory containing .dungeonmaster.json
 *
 * const guildPath = await cwdResolveBroker({ startPath, kind: 'guild-path' });
 * // Returns GuildPathCwd — directory containing guild.json (walks up)
 */

import { configRootFindBroker } from '../../config-root/find/config-root-find-broker';
import { projectRootFindBroker } from '../../project-root/find/project-root-find-broker';
import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { guildPathWalkUpLayerBroker } from './guild-path-walk-up-layer-broker';
import { repoRootCwdContract } from '../../../contracts/repo-root-cwd/repo-root-cwd-contract';
import { projectRootCwdContract } from '../../../contracts/project-root-cwd/project-root-cwd-contract';
import { guildPathCwdContract } from '../../../contracts/guild-path-cwd/guild-path-cwd-contract';
import { dungeonmasterHomeCwdContract } from '../../../contracts/dungeonmaster-home-cwd/dungeonmaster-home-cwd-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { RepoRootCwd } from '../../../contracts/repo-root-cwd/repo-root-cwd-contract';
import type { ProjectRootCwd } from '../../../contracts/project-root-cwd/project-root-cwd-contract';
import type { GuildPathCwd } from '../../../contracts/guild-path-cwd/guild-path-cwd-contract';
import type { DungeonmasterHomeCwd } from '../../../contracts/dungeonmaster-home-cwd/dungeonmaster-home-cwd-contract';

export type CwdKind = 'repo-root' | 'project-root' | 'guild-path' | 'dungeonmaster-home';

export type ResolvedCwdFor<K extends CwdKind> = K extends 'repo-root'
  ? RepoRootCwd
  : K extends 'project-root'
    ? ProjectRootCwd
    : K extends 'guild-path'
      ? GuildPathCwd
      : K extends 'dungeonmaster-home'
        ? DungeonmasterHomeCwd
        : never;

export const cwdResolveBroker = async <K extends CwdKind>({
  startPath,
  kind,
}: {
  startPath: FilePath;
  kind: K;
}): Promise<ResolvedCwdFor<K>> => {
  if (kind === 'repo-root') {
    const repoRoot = await configRootFindBroker({ startPath });
    return repoRootCwdContract.parse(repoRoot) as ResolvedCwdFor<K>;
  }

  if (kind === 'project-root') {
    const projectRoot = await projectRootFindBroker({ startPath });
    return projectRootCwdContract.parse(projectRoot) as ResolvedCwdFor<K>;
  }

  if (kind === 'guild-path') {
    const guildPath = await guildPathWalkUpLayerBroker({ startPath });
    return guildPathCwdContract.parse(guildPath) as ResolvedCwdFor<K>;
  }

  if (kind === 'dungeonmaster-home') {
    const { homePath } = dungeonmasterHomeFindBroker();
    return dungeonmasterHomeCwdContract.parse(homePath) as ResolvedCwdFor<K>;
  }

  throw new Error(`Unknown cwd kind: ${String(kind)}`);
};

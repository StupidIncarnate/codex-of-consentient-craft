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

export type CwdKind = 'repo-root' | 'project-root' | 'guild-path' | 'dungeonmaster-home';

export type ResolvedCwdFor<K extends CwdKind> = K extends 'repo-root'
  ? string
  : K extends 'project-root'
    ? string
    : K extends 'guild-path'
      ? string
      : K extends 'dungeonmaster-home'
        ? string
        : never;

export const cwdResolveBroker = async <K extends CwdKind>({
  startPath,
  kind,
}: {
  startPath: string;
  kind: K;
}): Promise<ResolvedCwdFor<K>> => {
  if (kind === 'repo-root') {
    const repoRoot = await configRootFindBroker({ startPath });
    return repoRoot as ResolvedCwdFor<K>;
  }

  if (kind === 'project-root') {
    const projectRoot = await projectRootFindBroker({ startPath });
    return projectRoot as ResolvedCwdFor<K>;
  }

  if (kind === 'guild-path') {
    const guildPath = await guildPathWalkUpLayerBroker({ startPath });
    return guildPath as ResolvedCwdFor<K>;
  }

  if (kind === 'dungeonmaster-home') {
    const { homePath } = dungeonmasterHomeFindBroker();
    const homeDir: string = homePath;
    return homeDir as ResolvedCwdFor<K>;
  }

  throw new Error(`Unknown cwd kind: ${String(kind)}`);
};

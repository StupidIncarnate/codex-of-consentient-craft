/**
 * PURPOSE: Extracts the parent directory path from a given path by removing the last segment
 *
 * USAGE:
 * parentPathTransformer({path: '/home/user/projects'});
 * // Returns '/home/user' as GuildPath
 */
import { guildPathContract } from '@dungeonmaster/shared/contracts';
import type { GuildPath } from '@dungeonmaster/shared/contracts';

export const parentPathTransformer = ({ path }: { path: GuildPath }): GuildPath => {
  const parent = path.replace(/\/[^/]+\/?$/u, '') || '/';

  return guildPathContract.parse(parent);
};

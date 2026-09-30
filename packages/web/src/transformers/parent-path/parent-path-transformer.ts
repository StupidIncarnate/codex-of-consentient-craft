/**
 * PURPOSE: Extracts the parent directory path from a given path by removing the last segment
 *
 * USAGE:
 * parentPathTransformer({path: '/home/user/projects'});
 * // Returns '/home/user' as GuildPath
 */

export const parentPathTransformer = ({ path }: { path: string }): string => {
  const parent = path.replace(/\/[^/]+\/?$/u, '') || '/';

  return parent;
};

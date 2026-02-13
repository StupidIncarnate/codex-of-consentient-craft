/**
 * PURPOSE: Extracts the parent directory path from a given path by removing the last segment
 *
 * USAGE:
 * parentPathTransformer({path: '/home/user/projects'});
 * // Returns '/home/user' as ProjectPath
 */
import { projectPathContract } from '@dungeonmaster/shared/contracts';
import type { ProjectPath } from '@dungeonmaster/shared/contracts';

export const parentPathTransformer = ({ path }: { path: ProjectPath }): ProjectPath => {
  const parent = path.replace(/\/[^/]+\/?$/u, '') || '/';

  return projectPathContract.parse(parent);
};

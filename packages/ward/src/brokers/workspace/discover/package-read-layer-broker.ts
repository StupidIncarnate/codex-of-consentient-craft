/**
 * PURPOSE: Reads a single directory's package.json and returns a ProjectFolder or null if invalid or has no src/
 *
 * USAGE:
 * const folder = await packageReadLayerBroker({ fullPath: '/project/packages/ward', rootPath });
 * // Returns ProjectFolder with name and path, or null if package.json missing, has no name, or has no src/ directory
 */

import { readdirEntries, readFile } from '#gateway/node/fs__promises';
import { stderr } from '#gateway/node/process';

import {
  projectFolderContract,
  type ProjectFolder,
} from '../../../contracts/project-folder/project-folder-contract';
import { packageJsonContract } from '@dungeonmaster/shared/contracts';

export const packageReadLayerBroker = async ({
  fullPath,
}: {
  fullPath: string;
  rootPath: string;
}): Promise<ProjectFolder | null> => {
  const pkgPath = `${fullPath}/package.json`;
  try {
    const contents = await readFile(pkgPath);
    const parsed = packageJsonContract.parse(JSON.parse(contents));
    const { name } = parsed;
    if (typeof name !== 'string') {
      return null;
    }

    const entries = await readdirEntries(fullPath).catch(() => []);
    const hasSrc = entries.some((entry) => entry.kind === 'directory' && entry.name === 'src');

    if (!hasSrc) {
      stderr.write(`ward: skipping ${name} (no src/ directory)\n`);
      return null;
    }

    return projectFolderContract.parse({ name, path: fullPath });
  } catch {
    return null;
  }
};

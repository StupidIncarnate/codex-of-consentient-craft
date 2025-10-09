import { access, constants } from 'fs/promises';
import { pathDirname } from '../../../adapters/path/path-dirname';
import { pathJoin } from '../../../adapters/path/path-join';
import { ConfigNotFoundError } from '../../../errors/config-not-found/config-not-found-error';
import type { FilePath } from '@questmaestro/shared/contracts';
import { filePathContract } from '@questmaestro/shared/contracts';

const CONFIG_FILENAME = '.questmaestro';

const checkConfigExists = async ({ configPath }: { configPath: FilePath }): Promise<boolean> => {
  try {
    await access(configPath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

const searchConfigRecursive = async ({
  currentPath,
  originalPath,
}: {
  currentPath: FilePath;
  originalPath: FilePath;
}): Promise<FilePath> => {
  const configPath = filePathContract.parse(pathJoin({ paths: [currentPath, CONFIG_FILENAME] }));

  const exists = await checkConfigExists({ configPath });
  if (exists) {
    return configPath;
  }

  // Check if we've reached the root directory
  const parentPath = pathDirname({ path: currentPath });
  if (parentPath === currentPath) {
    // We've reached the root directory
    throw new ConfigNotFoundError({ startPath: originalPath });
  }

  return searchConfigRecursive({ currentPath: parentPath, originalPath });
};

export const configFileFindBroker = async ({
  startPath,
}: {
  startPath: FilePath;
}): Promise<FilePath> => {
  const currentPath = pathDirname({ path: startPath });
  return searchConfigRecursive({ currentPath, originalPath: startPath });
};

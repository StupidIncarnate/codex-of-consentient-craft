import { access, constants } from 'fs/promises';
import { pathDirname } from '../../../adapters/path/path-dirname';
import { pathJoin } from '../../../adapters/path/path-join';
import { ConfigNotFoundError } from '../../../errors/config-not-found/config-not-found-error';

const CONFIG_FILENAME = '.questmaestro';

const checkConfigExists = async ({ configPath }: { configPath: string }): Promise<boolean> => {
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
  currentPath: string;
  originalPath: string;
}): Promise<string> => {
  const configPath = pathJoin({ paths: [currentPath, CONFIG_FILENAME] });

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
  startPath: string;
}): Promise<string> => {
  const currentPath = pathDirname({ path: startPath });
  return searchConfigRecursive({ currentPath, originalPath: startPath });
};

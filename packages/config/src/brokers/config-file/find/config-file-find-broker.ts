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

export const configFileFindBroker = async ({
  startPath,
}: {
  startPath: string;
}): Promise<string> => {
  let currentPath = pathDirname({ path: startPath });
  const originalPath = startPath;
  const searching = true;

  // Walk up the directory tree looking for .questmaestro
  while (searching) {
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

    currentPath = parentPath;
  }

  // This line is unreachable but satisfies TypeScript
  throw new ConfigNotFoundError({ startPath: originalPath });
};

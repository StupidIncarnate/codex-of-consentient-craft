/**
 * PURPOSE: Checks if a file path represents an entry file based on known folder type suffixes
 *
 * USAGE:
 * isEntryFileGuard({filePath: 'src/brokers/auth/login/auth-login-broker.ts', folderConfigs: folderConfigStatics});
 * // Returns true if the filename ends with a known folder type suffix and is not a layer file
 */
import type { folderConfigStatics } from '@dungeonmaster/shared/statics';

export const isEntryFileGuard = ({
  filePath,
  folderConfigs,
}: {
  filePath?: string;
  folderConfigs?: typeof folderConfigStatics;
}): boolean => {
  if (!filePath || !folderConfigs) {
    return false;
  }

  const fileName = filePath.slice(filePath.lastIndexOf('/') + 1);

  if (fileName.includes('-layer-')) {
    return false;
  }

  const configKeys = Object.keys(folderConfigs) as (keyof typeof folderConfigs)[];

  for (const key of configKeys) {
    const { fileSuffix } = folderConfigs[key];
    const suffixes = Array.isArray(fileSuffix) ? fileSuffix : [fileSuffix];

    for (const suffix of suffixes) {
      const suffixValue = String(suffix);

      if (!suffixValue.startsWith('-')) {
        continue;
      }

      if (fileName.endsWith(suffixValue)) {
        return true;
      }
    }
  }

  return false;
};

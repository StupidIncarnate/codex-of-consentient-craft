/**
 * PURPOSE: Extracts the first file suffix from a FolderConfig
 *
 * USAGE:
 * const suffix = firstFileSuffixTransformer({ config: FolderConfigStub({...}) });
 * // Returns ContentText with first suffix (e.g., '-broker.ts' or '-contract.ts')
 */

import type { FolderConfig } from '@dungeonmaster/shared/contracts';

export const firstFileSuffixTransformer = ({ config }: { config: FolderConfig }): string => {
  if (typeof config.fileSuffix === 'string') {
    return config.fileSuffix;
  }

  const [firstSuffix] = config.fileSuffix;
  if (firstSuffix === undefined) {
    return '';
  }

  return firstSuffix;
};

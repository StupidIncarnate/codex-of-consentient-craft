/**
 * PURPOSE: Extracts the first file suffix from a FolderConfig
 *
 * USAGE:
 * const suffix = firstFileSuffixTransformer({ config: FolderConfigStub({...}) });
 * // Returns ContentText with first suffix (e.g., '-broker.ts' or '-contract.ts')
 */

import type { FolderConfig } from '@dungeonmaster/shared/contracts';
import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';

export const firstFileSuffixTransformer = ({ config }: { config: FolderConfig }): ContentText => {
  if (typeof config.fileSuffix === 'string') {
    return contentTextContract.parse(config.fileSuffix);
  }

  const [firstSuffix] = config.fileSuffix;
  if (firstSuffix === undefined) {
    return contentTextContract.parse('');
  }

  return contentTextContract.parse(firstSuffix);
};

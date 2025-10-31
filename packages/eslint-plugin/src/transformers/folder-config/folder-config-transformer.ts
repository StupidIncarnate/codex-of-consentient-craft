/**
 * PURPOSE: Retrieves the configuration object for a specific folder type (brokers, contracts, guards, etc.)
 *
 * USAGE:
 * const config = folderConfigTransformer({ folderType: 'brokers' });
 * // Returns: { fileSuffix: 'broker', requireProxy: true, allowedImports: [...] }
 *
 * const unknownConfig = folderConfigTransformer({ folderType: 'unknown' });
 * // Returns: undefined
 */
import { isKeyOfGuard } from '@questmaestro/shared/guards';

import { folderConfigStatics } from '@questmaestro/shared/statics';

type FolderConfig = (typeof folderConfigStatics)[keyof typeof folderConfigStatics];

export const folderConfigTransformer = ({
  folderType,
}: {
  folderType: string;
}): FolderConfig | undefined => {
  if (!isKeyOfGuard(folderType, folderConfigStatics)) {
    return undefined;
  }

  return folderConfigStatics[folderType];
};

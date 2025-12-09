/**
 * PURPOSE: Converts a plural folder type name to singular by removing trailing 's'
 *
 * USAGE:
 * const singular = singularizeFolderTypeTransformer({ folderType: 'brokers' });
 * // Returns: 'broker'
 *
 * const adapter = singularizeFolderTypeTransformer({ folderType: 'adapters' });
 * // Returns: 'adapter'
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';

export const singularizeFolderTypeTransformer = ({
  folderType,
}: {
  folderType: string;
}): Identifier => {
  const singular = folderType.replace(/s$/u, '');

  return identifierContract.parse(singular);
};

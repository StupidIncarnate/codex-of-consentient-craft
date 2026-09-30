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

export const singularizeFolderTypeTransformer = ({
  folderType,
}: {
  folderType: string;
}): string => {
  const singular = folderType.replace(/s$/u, '');

  return singular;
};

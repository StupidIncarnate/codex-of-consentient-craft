/**
 * PURPOSE: Extracts the project folder type (brokers, contracts, guards, etc.) from a file path
 *
 * USAGE:
 * const folderType = projectFolderTypeFromFilePathTransformer({ filename: '/project/src/brokers/user/fetch.ts' });
 * // Returns 'brokers'
 */

export const projectFolderTypeFromFilePathTransformer = ({
  filename,
}: {
  filename: string;
}): string | null => {
  const [, pathAfterSrc] = filename.split('/src/');

  if (pathAfterSrc === undefined || pathAfterSrc === '' || !pathAfterSrc.includes('/')) {
    return null;
  }

  const [firstFolder] = pathAfterSrc.split('/');

  if (firstFolder === undefined || firstFolder === '') {
    return null;
  }

  return firstFolder;
};

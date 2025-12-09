/**
 * PURPOSE: Extracts the folder type (brokers, contracts, guards, etc.) from a file path that follows the src/[folder-type]/ structure
 *
 * USAGE:
 * const folderType = folderTypeTransformer({ filename: '/project/src/brokers/user/user-broker.ts' });
 * // Returns: 'brokers'
 *
 * const noType = folderTypeTransformer({ filename: '/project/lib/file.ts' });
 * // Returns: null
 */
import { folderTypeContract, type FolderType } from '@dungeonmaster/shared/contracts';

export const folderTypeTransformer = ({ filename }: { filename: string }): FolderType | null => {
  const normalizedPath = filename.replace(/\\/gu, '/');
  const srcPattern = /(?:^|\/)src\//u;
  const match = srcPattern.exec(normalizedPath);

  if (!match) {
    return null;
  }

  const afterSrc = normalizedPath.slice(match.index + match[0].length);
  const firstSlash = afterSrc.indexOf('/');

  if (firstSlash === -1) {
    return null;
  }

  const folderName = afterSrc.slice(0, firstSlash);
  const parseResult = folderTypeContract.safeParse(folderName);

  if (parseResult.success) {
    return parseResult.data;
  }

  return null;
};

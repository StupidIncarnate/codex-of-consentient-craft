import type { FolderType } from '../../contracts/folder-type/folder-type-contract';
import { folderTypeContract } from '../../contracts/folder-type/folder-type-contract';

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

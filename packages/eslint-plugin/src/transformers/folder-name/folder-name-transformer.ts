import type { Identifier } from '@questmaestro/shared/contracts';
import { identifierContract } from '@questmaestro/shared/contracts';

export const folderNameTransformer = ({ filePath }: { filePath: string }): Identifier | null => {
  const parts = filePath.split('/');

  const MINIMUM_PARTS_FOR_FOLDER = 2;
  const PARENT_FOLDER_OFFSET = 2;

  // If the path has 2 or fewer parts, there's no containing folder
  // E.g., 'file.ts' (1 part) or 'folder/file.ts' (2 parts - we need at least the folder)
  if (parts.length < MINIMUM_PARTS_FOR_FOLDER) {
    return null;
  }

  // Get the second-to-last element (the immediate parent folder)
  const folderName = parts[parts.length - PARENT_FOLDER_OFFSET];

  // Return null if the folder name is empty or undefined (edge case with trailing slashes)
  if (folderName === undefined || folderName === '') {
    return null;
  }

  return identifierContract.parse(folderName);
};

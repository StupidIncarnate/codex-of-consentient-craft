import { isKeyOfGuard } from '@questmaestro/shared/guards';

import type { FolderSuggestion } from '../../contracts/folder-suggestion/folder-suggestion-contract';
import { folderSuggestionContract } from '../../contracts/folder-suggestion/folder-suggestion-contract';
import { forbiddenFolderStatics } from '../../statics/forbidden-folder/forbidden-folder-statics';

export const forbiddenFolderSuggestionTransformer = ({
  forbiddenFolder,
}: {
  forbiddenFolder: string;
}): FolderSuggestion => {
  if (isKeyOfGuard(forbiddenFolder, forbiddenFolderStatics.mappings)) {
    return folderSuggestionContract.parse(forbiddenFolderStatics.mappings[forbiddenFolder]);
  }
  return folderSuggestionContract.parse('contracts');
};

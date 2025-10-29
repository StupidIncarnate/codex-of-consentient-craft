import { isKeyOfGuard } from '@questmaestro/shared/guards';

import type { FolderSuggestion } from '../../contracts/folder-suggestion/folder-suggestion-contract';
import { folderSuggestionContract } from '../../contracts/folder-suggestion/folder-suggestion-contract';
import { forbiddenFolderStatics } from '../../statics/forbidden-folder/forbidden-folder-statics';

/**
 * PURPOSE: Suggests the correct folder type to use when a forbidden folder name is detected
 *
 * USAGE:
 * const suggestion = forbiddenFolderSuggestionTransformer({ forbiddenFolder: 'helpers' });
 * // Returns: 'transformers' (or 'guards', depending on the mapping)
 *
 * const defaultSuggestion = forbiddenFolderSuggestionTransformer({ forbiddenFolder: 'unknown' });
 * // Returns: 'contracts' (default fallback)
 */
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

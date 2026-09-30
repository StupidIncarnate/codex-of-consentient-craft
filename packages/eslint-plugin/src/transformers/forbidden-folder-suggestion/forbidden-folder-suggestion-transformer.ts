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
import { isKeyOfGuard } from '@dungeonmaster/shared/guards';

import { forbiddenFolderStatics } from '../../statics/forbidden-folder/forbidden-folder-statics';

export const forbiddenFolderSuggestionTransformer = ({
  forbiddenFolder,
}: {
  forbiddenFolder: string;
}): string => {
  if (isKeyOfGuard(forbiddenFolder, forbiddenFolderStatics.mappings)) {
    return forbiddenFolderStatics.mappings[forbiddenFolder];
  }
  return 'contracts';
};

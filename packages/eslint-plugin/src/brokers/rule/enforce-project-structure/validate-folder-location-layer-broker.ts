/**
 * PURPOSE: Validates folder location is allowed and not forbidden (Level 1 of project structure validation)
 *
 * USAGE:
 * const shouldContinue = validateFolderLocationLayerBroker({node, context, firstFolder, folderConfig, isLayerFile});
 * // Returns true if folder location is valid, false if validation failed (error reported)
 */
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';
import { forbiddenFolderStatics } from '../../../statics/forbidden-folder/forbidden-folder-statics';
import { forbiddenFolderSuggestionTransformer } from '../../../transformers/forbidden-folder-suggestion/forbidden-folder-suggestion-transformer';

const allowedFolders = Object.keys(folderConfigStatics);

export const validateFolderLocationLayerBroker = ({
  node,
  context,
  firstFolder,
  folderConfig,
  isLayerFile,
}: {
  node: TSESTree.Node;
  context: TSESLint.RuleContext<string, unknown[]>;
  firstFolder: Identifier;
  folderConfig: (typeof folderConfigStatics)[keyof typeof folderConfigStatics];
  isLayerFile: boolean;
}): boolean => {
  if (firstFolder in forbiddenFolderStatics.mappings) {
    const suggestion = forbiddenFolderSuggestionTransformer({
      forbiddenFolder: firstFolder,
    });
    context.report({
      node,
      messageId: 'forbiddenFolder',
      data: {
        folder: firstFolder,
        suggestion,
      },
    });
    return false;
  }

  if (!allowedFolders.includes(firstFolder)) {
    context.report({
      node,
      messageId: 'unknownFolder',
      data: {
        folder: firstFolder,
        allowed: allowedFolders.join(', '),
      },
    });
    return false;
  }

  if (isLayerFile && !folderConfig.allowsLayerFiles) {
    context.report({
      node,
      messageId: 'layerFilesNotAllowed',
      data: {
        folderType: firstFolder,
      },
    });
    return false;
  }

  return true;
};

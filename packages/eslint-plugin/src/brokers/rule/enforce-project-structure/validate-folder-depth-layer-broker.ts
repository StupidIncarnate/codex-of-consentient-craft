/**
 * PURPOSE: Validates folder depth and kebab-case folder names (Level 2 of project structure validation)
 *
 * USAGE:
 * const shouldContinue = validateFolderDepthLayerBroker({node, context, filename, firstFolder, folderConfig});
 * // Returns true if depth and folder names are valid, false if validation failed (error reported)
 */
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import type { folderConfigStatics } from '@dungeonmaster/shared/statics';
import { isKebabCaseGuard } from '../../../guards/is-kebab-case/is-kebab-case-guard';
import { pathDepthTransformer } from '../../../transformers/path-depth/path-depth-transformer';
import { filepathExtractSegmentsAfterSrcTransformer } from '../../../transformers/filepath-extract-segments-after-src/filepath-extract-segments-after-src-transformer';
import { toKebabCaseTransformer } from '../../../transformers/to-kebab-case/to-kebab-case-transformer';
import { getFileExtensionTransformer } from '../../../transformers/get-file-extension/get-file-extension-transformer';

export const validateFolderDepthLayerBroker = ({
  node,
  context,
  filename,
  firstFolder,
  folderConfig,
}: {
  node: Tsestree;
  context: EslintContext;
  filename: string;
  firstFolder: Identifier;
  folderConfig: (typeof folderConfigStatics)[keyof typeof folderConfigStatics];
}): boolean => {
  const actualDepth = pathDepthTransformer({ filePath: filename });
  const expectedDepth = folderConfig.folderDepth;

  if (actualDepth !== expectedDepth) {
    context.report({
      node,
      messageId: 'invalidFolderDepth',
      data: {
        folder: firstFolder,
        expected: String(expectedDepth),
        actual: String(actualDepth),
        pattern: folderConfig.folderPattern,
      },
    });
    return false;
  }

  const folderSegments = filepathExtractSegmentsAfterSrcTransformer({ filePath: filename });
  const nonKebabFolder = folderSegments.find((segment) => !isKebabCaseGuard({ str: segment }));
  if (nonKebabFolder) {
    const expected = toKebabCaseTransformer({ str: nonKebabFolder });
    const ext = getFileExtensionTransformer({ filename, includesDot: false });
    context.report({
      node,
      messageId: 'invalidFilenameCase',
      data: {
        actual: nonKebabFolder,
        expected,
        ext,
      },
    });
    return false;
  }

  return true;
};

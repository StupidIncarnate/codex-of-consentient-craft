/**
 * PURPOSE: Validates filename suffix, kebab-case, and domain prefix match (Level 3 of project structure validation)
 *
 * USAGE:
 * const shouldContinue = validateFilenameLayerBroker({node, context, filename, firstFolder, folderConfig, isLayerFile});
 * // Returns true if filename is valid, false if validation failed (errors reported)
 */
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { folderConfigStatics } from '@dungeonmaster/shared/statics';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isKebabCaseGuard } from '../../../guards/is-kebab-case/is-kebab-case-guard';
import { filepathBasenameWithoutSuffixTransformer } from '../../../transformers/filepath-basename-without-suffix/filepath-basename-without-suffix-transformer';
import { filepathExtractSegmentsAfterSrcTransformer } from '../../../transformers/filepath-extract-segments-after-src/filepath-extract-segments-after-src-transformer';
import { getFileExtensionTransformer } from '../../../transformers/get-file-extension/get-file-extension-transformer';
import { removeFileExtensionTransformer } from '../../../transformers/remove-file-extension/remove-file-extension-transformer';
import { toKebabCaseTransformer } from '../../../transformers/to-kebab-case/to-kebab-case-transformer';

export const validateFilenameLayerBroker = ({
  node,
  context,
  filename,
  firstFolder,
  folderConfig,
  isLayerFile,
}: {
  node: Tsestree;
  context: EslintContext;
  filename: string;
  firstFolder: Identifier;
  folderConfig: (typeof folderConfigStatics)[keyof typeof folderConfigStatics];
  isLayerFile: boolean;
}): boolean => {
  const isProxy = hasFileSuffixGuard({ filename, suffix: 'proxy' });
  const fileExtension = getFileExtensionTransformer({ filename, includesDot: true });
  const proxySuffix = fileExtension === '.tsx' ? '.proxy.tsx' : '.proxy.ts';
  const fileSuffix = isProxy ? proxySuffix : folderConfig.fileSuffix;
  const exportSuffix = isProxy ? 'Proxy' : folderConfig.exportSuffix;
  const { exportCase } = folderConfig;

  // Skip assets/migrations entirely (they have empty exportSuffix AND empty exportCase)
  if (exportSuffix === '' && exportCase === '') {
    return true;
  }

  // Collect all Level 3 violations (don't return early - report all)
  const suffixes = Array.isArray(fileSuffix) ? fileSuffix : [fileSuffix];
  const hasInvalidSuffix = !suffixes.some((suffix: string) => filename.endsWith(suffix));
  const filenameBase = filepathBasenameWithoutSuffixTransformer({
    filePath: filename,
    suffix: fileSuffix,
  });
  const hasInvalidCase = !isKebabCaseGuard({ str: filenameBase });

  // For folders with depth > 0, validate filename prefix matches domain folders
  // Skip domain matching for layer files (they have their own naming pattern)
  let hasInvalidDomainMatch = false;
  let expectedFilenamePrefix = '';
  const expectedDepth = folderConfig.folderDepth;

  if (expectedDepth > 0 && !isLayerFile) {
    const domainFolderSegments = filepathExtractSegmentsAfterSrcTransformer({
      filePath: filename,
    });
    const domainFolders = domainFolderSegments.slice(1, 1 + expectedDepth);
    expectedFilenamePrefix = domainFolders.join('-');

    let actualFilenamePrefix = filenameBase;
    if (isProxy) {
      const baseSuffix = folderConfig.fileSuffix;
      const baseSuffixStr = Array.isArray(baseSuffix) ? String(baseSuffix[0]) : String(baseSuffix);
      const baseSuffixToRemove = removeFileExtensionTransformer({
        filename: baseSuffixStr,
      });
      actualFilenamePrefix = identifierContract.parse(
        filenameBase.replace(new RegExp(`${baseSuffixToRemove}$`, 'u'), ''),
      );
    }

    if (actualFilenamePrefix !== expectedFilenamePrefix) {
      hasInvalidDomainMatch = true;
    }
  }

  // Report all Level 3 violations
  if (hasInvalidSuffix) {
    const expectedSuffix = Array.isArray(fileSuffix) ? fileSuffix.join(' or ') : String(fileSuffix);

    context.report({
      node,
      messageId: folderConfig.allowsLayerFiles ? 'invalidFileSuffixWithLayer' : 'invalidFileSuffix',
      data: {
        expected: expectedSuffix,
        folderType: firstFolder,
      },
    });
  }

  if (hasInvalidCase) {
    const expected = toKebabCaseTransformer({ str: filenameBase });
    const ext = getFileExtensionTransformer({ filename, includesDot: false });
    const suffixStr = Array.isArray(fileSuffix) ? String(fileSuffix[0]) : String(fileSuffix);
    const suffixWithoutExtension = removeFileExtensionTransformer({ filename: suffixStr });
    const actualFullFilename = filenameBase + suffixWithoutExtension;
    const expectedFullFilename = expected + suffixWithoutExtension;

    context.report({
      node,
      messageId: folderConfig.allowsLayerFiles
        ? 'invalidFilenameCaseWithLayer'
        : 'invalidFilenameCase',
      data: {
        actual: actualFullFilename,
        expected: expectedFullFilename,
        ext,
      },
    });
  } else if (hasInvalidDomainMatch) {
    const suffixStr = Array.isArray(fileSuffix) ? String(fileSuffix[0]) : String(fileSuffix);
    const suffixWithoutExtension = removeFileExtensionTransformer({ filename: suffixStr });
    const expectedFullFilename = expectedFilenamePrefix + suffixWithoutExtension;
    const actualFullFilename = filenameBase + suffixWithoutExtension;
    const ext = getFileExtensionTransformer({ filename, includesDot: false });

    context.report({
      node,
      messageId: folderConfig.allowsLayerFiles
        ? 'invalidFilenameCaseWithLayer'
        : 'invalidFilenameCase',
      data: {
        actual: actualFullFilename,
        expected: expectedFullFilename,
        ext,
      },
    });
  }

  return !(hasInvalidSuffix || hasInvalidCase || hasInvalidDomainMatch);
};

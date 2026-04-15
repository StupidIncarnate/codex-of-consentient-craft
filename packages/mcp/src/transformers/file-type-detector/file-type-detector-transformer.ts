/**
 * PURPOSE: Detects file type from filepath by extracting folder after src/ or test/, or using file suffix
 *
 * USAGE:
 * const fileType = fileTypeDetectorTransformer({
 *   filepath: FilePathStub({ value: '/packages/eslint-plugin/src/brokers/user/fetch/user-fetch-broker.ts' })
 * });
 * // Returns: 'broker'
 *
 * WHEN-TO-USE: Need to categorize files by their location or naming pattern
 * WHEN-NOT-TO-USE: When file type is already known or provided explicitly
 */
import { fileTypeContract } from '../../contracts/file-type/file-type-contract';
import { fileDiscoveryStatics } from '../../statics/file-discovery/file-discovery-statics';
import type { PathSegment } from '@dungeonmaster/shared/contracts';
import type { FileType } from '../../contracts/file-type/file-type-contract';

export const fileTypeDetectorTransformer = ({ filepath }: { filepath: PathSegment }): FileType => {
  const pathParts = filepath.split('/');

  // Find the folder immediately after any path anchor (src, test)
  for (const anchor of fileDiscoveryStatics.pathAnchors) {
    const anchorIndex = pathParts.lastIndexOf(anchor);
    if (
      anchorIndex !== -1 &&
      anchorIndex + fileDiscoveryStatics.minPartsAfterAnchor < pathParts.length
    ) {
      const folderAfterAnchor = pathParts[anchorIndex + 1];
      if (folderAfterAnchor) {
        // Remove trailing plural suffix to get singular form
        // harnesses -> harness (strip 'es'), brokers -> broker (strip 's')
        const { esSuffix, sSuffix } = fileDiscoveryStatics.pluralSuffixes;
        const singularForm = folderAfterAnchor.endsWith(esSuffix.ending)
          ? folderAfterAnchor.slice(0, -esSuffix.stripLength)
          : folderAfterAnchor.endsWith(sSuffix.ending)
            ? folderAfterAnchor.slice(0, -sSuffix.stripLength)
            : folderAfterAnchor;
        return fileTypeContract.parse(singularForm);
      }
    }
  }

  // Fallback: extract from file suffix pattern (name-TYPE.ts)
  const fileName = pathParts[pathParts.length - 1] ?? '';
  const suffixMatch = /-(\w+)\.(ts|tsx|js|jsx)$/u.exec(fileName);
  if (suffixMatch) {
    return fileTypeContract.parse(suffixMatch[1]);
  }

  return fileTypeContract.parse('unknown');
};

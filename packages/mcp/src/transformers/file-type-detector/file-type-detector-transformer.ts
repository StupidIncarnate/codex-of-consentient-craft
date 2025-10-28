import { fileTypeContract } from '../../contracts/file-type/file-type-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { FileType } from '../../contracts/file-type/file-type-contract';

/**
 * PURPOSE: Detects file type from filepath by extracting folder after src/ or using file suffix
 *
 * USAGE:
 * const fileType = fileTypeDetectorTransformer({
 *   filepath: FilePathStub({ value: '/packages/eslint-plugin/src/brokers/user/fetch/user-fetch-broker.ts' })
 * });
 * // Returns: 'broker'
 *
 * WHEN-TO-USE: Need to categorize files by their location or naming pattern
 * WHEN-NOT-TO-USE: When file type is already known or provided explicitly
 *
 * RELATED: metadataExtractorTransformer, signatureExtractorTransformer
 */
export const fileTypeDetectorTransformer = ({ filepath }: { filepath: FilePath }): FileType => {
  const pathParts = filepath.split('/');

  // Find the folder immediately after 'src'
  const srcIndex = pathParts.lastIndexOf('src');
  if (srcIndex !== -1 && srcIndex + 1 < pathParts.length) {
    const folderAfterSrc = pathParts[srcIndex + 1];
    if (folderAfterSrc) {
      // Remove trailing 's' to get singular form (brokers -> broker)
      const singularForm = folderAfterSrc.endsWith('s')
        ? folderAfterSrc.slice(0, -1)
        : folderAfterSrc;
      return fileTypeContract.parse(singularForm);
    }
  }

  // Fallback: extract from file suffix pattern (name-TYPE.ts)
  const fileName = pathParts[pathParts.length - 1] ?? '';
  const suffixMatch = /-(\w+)\.(ts|tsx)$/u.exec(fileName);
  if (suffixMatch) {
    return fileTypeContract.parse(suffixMatch[1]);
  }

  return fileTypeContract.parse('unknown');
};

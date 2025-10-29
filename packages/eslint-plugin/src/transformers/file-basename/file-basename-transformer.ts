import type { FileName } from '../../contracts/file-name/file-name-contract';
import { fileNameContract } from '../../contracts/file-name/file-name-contract';

/**
 * PURPOSE: Extracts the basename from a file path without extension
 *
 * USAGE:
 * const basename = fileBasenameTransformer({ filename: '/path/to/user-fetch-broker.ts' });
 * // Returns 'user-fetch-broker'
 * const basename2 = fileBasenameTransformer({ filename: 'widget.tsx' });
 * // Returns 'widget'
 *
 * WHEN-TO-USE: When extracting file names from full paths for validation or comparison
 */
export const fileBasenameTransformer = ({ filename }: { filename: string }): FileName => {
  const parts = filename.split('/');
  const fileWithExt = parts[parts.length - 1] ?? '';
  return fileNameContract.parse(fileWithExt.replace(/\.(ts|tsx|js|jsx)$/u, ''));
};

import type { FileName } from '../../contracts/file-name/file-name-contract';
import { fileNameContract } from '../../contracts/file-name/file-name-contract';

/**
 * Extracts the basename from a filename without extension.
 * Example: '/path/to/user-fetch-broker.ts' -> 'user-fetch-broker'
 */
export const fileBasenameTransformer = ({ filename }: { filename: string }): FileName => {
  const parts = filename.split('/');
  const fileWithExt = parts[parts.length - 1] ?? '';
  return fileNameContract.parse(fileWithExt.replace(/\.(ts|tsx|js|jsx)$/u, ''));
};

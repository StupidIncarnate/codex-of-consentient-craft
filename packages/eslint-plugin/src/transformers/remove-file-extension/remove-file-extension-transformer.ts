/**
 * PURPOSE: Removes TypeScript file extensions (.ts or .tsx) from a filename
 *
 * USAGE:
 * const name = removeFileExtensionTransformer({ filename: 'user-broker.ts' });
 * // Returns: 'user-broker'
 *
 * const tsxName = removeFileExtensionTransformer({ filename: 'user-widget.tsx' });
 * // Returns: 'user-widget'
 */
import { fileNameContract } from '../../contracts/file-name/file-name-contract';
import type { FileName } from '../../contracts/file-name/file-name-contract';

export const removeFileExtensionTransformer = ({ filename }: { filename: string }): FileName => {
  const withoutExtension = filename.replace(/\.(ts|tsx)$/u, '');

  // If result is empty (e.g., ".ts" -> ""), return original
  const result = withoutExtension || filename;

  return fileNameContract.parse(result);
};

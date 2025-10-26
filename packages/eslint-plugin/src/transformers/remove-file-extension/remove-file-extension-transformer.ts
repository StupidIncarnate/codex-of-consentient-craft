import { fileNameContract } from '../../contracts/file-name/file-name-contract';
import type { FileName } from '../../contracts/file-name/file-name-contract';

export const removeFileExtensionTransformer = ({ filename }: { filename: string }): FileName => {
  const withoutExtension = filename.replace(/\.(ts|tsx)$/u, '');

  // If result is empty (e.g., ".ts" -> ""), return original
  const result = withoutExtension || filename;

  return fileNameContract.parse(result);
};

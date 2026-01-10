/**
 * PURPOSE: Converts a .ts file path to .tsx file path
 *
 * USAGE:
 * const tsxPath = tsToTsxPathTransformer({
 *   tsPath: '/src/widgets/user/user-widget.ts'
 * });
 * // Returns: '/src/widgets/user/user-widget.tsx'
 */
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const tsToTsxPathTransformer = ({ tsPath }: { tsPath: string }): FilePath => {
  const tsxPath = tsPath.replace(/\.ts$/u, '.tsx');

  return filePathContract.parse(tsxPath);
};

/**
 * PURPOSE: Converts a .ts file path to .tsx file path
 *
 * USAGE:
 * const tsxPath = tsToTsxPathTransformer({
 *   tsPath: '/src/widgets/user/user-widget.ts'
 * });
 * // Returns: '/src/widgets/user/user-widget.tsx'
 */

export const tsToTsxPathTransformer = ({ tsPath }: { tsPath: string }): string => {
  const tsxPath = tsPath.replace(/\.ts$/u, '.tsx');

  return tsxPath;
};

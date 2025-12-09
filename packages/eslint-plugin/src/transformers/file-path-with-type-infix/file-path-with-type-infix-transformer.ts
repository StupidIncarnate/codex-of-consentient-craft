/**
 * PURPOSE: Inserts '.type' infix before the file extension (.ts or .tsx)
 *
 * USAGE:
 * const typePath = filePathWithTypeInfixTransformer({
 *   filePath: '/src/contracts/user/user-contract.ts'
 * });
 * // Returns: '/src/contracts/user/user-contract.type.ts'
 *
 * const tsxPath = filePathWithTypeInfixTransformer({
 *   filePath: '/src/widgets/button/button-widget.tsx'
 * });
 * // Returns: '/src/widgets/button/button-widget.type.tsx'
 */
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';

export const filePathWithTypeInfixTransformer = ({
  filePath,
}: {
  filePath: FilePath;
}): FilePath => {
  const withTypeInfix = String(filePath).replace(/\.(ts|tsx)$/u, '.type.$1');
  return filePathContract.parse(withTypeInfix);
};

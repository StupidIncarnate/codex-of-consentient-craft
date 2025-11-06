/**
 * PURPOSE: Adapter for ESLint's calculateConfigForFile with type-safe handling
 *
 * USAGE:
 * const config = await eslintCalculateConfigForFileAdapter({ eslint, filePath: '/path/to/file.ts' });
 * // Returns Linter.Config object for the specified file
 */
import type { ESLint, Linter } from 'eslint';

/**
 * Adapter for ESLint's calculateConfigForFile method
 * Handles type-unsafe return value from ESLint's API
 *
 * NOTE: ESLint's calculateConfigForFile returns `any` in its type signature,
 * but in practice it always returns Linter.Config | null. This adapter handles
 * the type-unsafe API boundary by treating the result as unknown and using
 * runtime checks before type assertion.
 */
export const eslintCalculateConfigForFileAdapter = async ({
  eslint,
  filePath,
}: {
  eslint: ESLint;
  filePath: string;
}): Promise<Linter.Config> => {
  // Treat result as unknown to force proper type checking
  const result: unknown = await eslint.calculateConfigForFile(filePath);

  // Handle null/undefined case
  if (result === null || result === undefined) {
    return {};
  }

  // At this point we know result is not null/undefined
  // ESLint API guarantees it's a Linter.Config
  // Using double assertion through unknown for type safety
  return result as Linter.Config;
};

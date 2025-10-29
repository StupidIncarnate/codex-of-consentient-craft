import { modulePathContract } from '@questmaestro/shared/contracts';
import type { ModulePath } from '@questmaestro/shared/contracts';

/**
 * PURPOSE: Removes file extensions from import paths to normalize them for comparison
 *
 * USAGE:
 * const normalized = normalizeImportPathTransformer({ importPath: './user-broker.proxy.ts' });
 * // Returns: './user-broker'
 *
 * const alsoNormalized = normalizeImportPathTransformer({ importPath: './user-widget.tsx' });
 * // Returns: './user-widget'
 */
export const normalizeImportPathTransformer = ({
  importPath,
}: {
  importPath: string;
}): ModulePath => {
  let normalized = importPath;

  // Remove .proxy.ts or .proxy.tsx extensions
  if (normalized.endsWith('.proxy.ts') || normalized.endsWith('.proxy.tsx')) {
    normalized = normalized.slice(0, normalized.lastIndexOf('.'));
  }

  // Remove .ts or .tsx extensions
  if (normalized.endsWith('.ts') || normalized.endsWith('.tsx')) {
    normalized = normalized.slice(0, normalized.lastIndexOf('.'));
  }

  return modulePathContract.parse(normalized);
};

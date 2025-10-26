import { modulePathContract } from '@questmaestro/shared/contracts';
import type { ModulePath } from '@questmaestro/shared/contracts';

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

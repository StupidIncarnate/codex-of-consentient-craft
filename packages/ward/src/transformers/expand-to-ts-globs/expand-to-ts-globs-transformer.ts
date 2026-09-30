/**
 * PURPOSE: Expands a tsconfig include pattern into TypeScript-specific glob patterns
 *
 * USAGE:
 * expandToTsGlobsTransformer({ pattern: 'src' });
 * // Returns: ['src/**\/*.ts', 'src/**\/*.tsx']
 */

import { isTypescriptFileGuard } from '../../guards/is-typescript-file/is-typescript-file-guard';
import { tsExtensionsStatics } from '../../statics/ts-extensions/ts-extensions-statics';

export const expandToTsGlobsTransformer = ({
  pattern,
}: {
  pattern: string;
}): string[] => {
  const raw = String(pattern);

  if (isTypescriptFileGuard({ pattern: raw })) {
    return [raw];
  }

  if (raw.startsWith('@types')) {
    const base = raw.replace(/\/?\*.*$/u, '');
    return tsExtensionsStatics.declarationExtensions.map((ext) =>
      `${base}/**/*.${ext}`,
    );
  }

  const trimmed = raw.replace(/\/+$/u, '');

  if (trimmed.includes('*')) {
    const base = trimmed.replace(/\/?\*.*$/u, '');
    return tsExtensionsStatics.extensions.map((ext) =>
      `${base}/**/*.${ext}`,
    );
  }

  if (trimmed.includes('.')) {
    return [trimmed];
  }

  return tsExtensionsStatics.extensions.map((ext) =>
    `${trimmed}/**/*.${ext}`,
  );
};

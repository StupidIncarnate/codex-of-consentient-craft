/**
 * PURPOSE: Classifies an import specifier by whose code it reaches. `#gateway/*` is the gateway;
 * a relative path, another `#` subpath import, the workspace's own scope and any workspace
 * package's name are the repo; everything else is outside. The scope comes from the repo, so the
 * same rule holds in a consumer whose packages carry another scope.
 *
 * USAGE:
 * importOriginClassifyTransformer({ specifier: 'fs/promises', workspaceScope: '@acme', workspacePackageNames: [] });
 * // Returns 'outside'
 */
import { importOriginContract } from '../../contracts/import-origin/import-origin-contract';
import { censusLayoutStatics } from '../../statics/census-layout/census-layout-statics';
import type { ImportOrigin } from '../../contracts/import-origin/import-origin-contract';

export const importOriginClassifyTransformer = ({
  specifier,
  workspaceScope,
  workspacePackageNames,
}: {
  specifier: string;
  workspaceScope: string | null;
  workspacePackageNames: readonly string[];
}): ImportOrigin => {
  if (specifier.startsWith(`${censusLayoutStatics.gatewayImportPrefix}/`)) {
    return importOriginContract.parse('gateway');
  }
  const isRepo =
    specifier.startsWith('.') ||
    specifier.startsWith('#') ||
    (workspaceScope !== null && specifier.startsWith(`${workspaceScope}/`)) ||
    workspacePackageNames.some((name) => specifier === name || specifier.startsWith(`${name}/`));

  return importOriginContract.parse(isRepo ? 'repo' : 'outside');
};

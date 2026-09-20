/**
 * PURPOSE: Reads the compiled-output fields off a raw package.json record — `main`, `types`, the
 * top-level `bin`, and every exports condition except `"source"` — and turns each into a
 * `ManifestEntryDeclaration`. `"source"` is skipped on purpose: it deliberately names TypeScript,
 * and Node never honors it without `--conditions=source`, so it is not a compiled-output claim
 * this repo's own build is on the hook for.
 *
 * USAGE:
 * const declared = packageJsonDeclaredEntriesTransformer({ manifest: PackageJsonRawStub({ main: 'dist/index.js' }) });
 * // Returns ManifestEntryDeclaration[] — one per main/types/bin/exports-condition field found
 */

import { packageJsonRawContract } from '../../contracts/package-json-raw/package-json-raw-contract';
import type { PackageJsonRaw } from '../../contracts/package-json-raw/package-json-raw-contract';
import { manifestEntryDeclarationContract } from '../../contracts/manifest-entry-declaration/manifest-entry-declaration-contract';
import type { ManifestEntryDeclaration } from '../../contracts/manifest-entry-declaration/manifest-entry-declaration-contract';

const SKIPPED_EXPORTS_CONDITION = 'source';

export const packageJsonDeclaredEntriesTransformer = ({
  manifest,
}: {
  manifest: PackageJsonRaw;
}): ManifestEntryDeclaration[] => {
  const declarations: ManifestEntryDeclaration[] = [];
  const entries = Object.entries(manifest);

  const mainValue = entries.find(([key]) => key === 'main')?.[1];
  if (typeof mainValue === 'string') {
    declarations.push(
      manifestEntryDeclarationContract.parse({ field: 'main', declaredPath: mainValue }),
    );
  }

  const typesValue = entries.find(([key]) => key === 'types')?.[1];
  if (typeof typesValue === 'string') {
    declarations.push(
      manifestEntryDeclarationContract.parse({ field: 'types', declaredPath: typesValue }),
    );
  }

  const binValue = entries.find(([key]) => key === 'bin')?.[1];
  if (typeof binValue === 'string') {
    declarations.push(
      manifestEntryDeclarationContract.parse({ field: 'bin', declaredPath: binValue }),
    );
  } else if (binValue !== null && typeof binValue === 'object' && !Array.isArray(binValue)) {
    for (const [binName, binTarget] of Object.entries(binValue)) {
      if (typeof binTarget === 'string') {
        declarations.push(
          manifestEntryDeclarationContract.parse({
            field: `bin["${binName}"]`,
            declaredPath: binTarget,
          }),
        );
      }
    }
  }

  const exportsValue = entries.find(([key]) => key === 'exports')?.[1];
  if (exportsValue !== null && typeof exportsValue === 'object' && !Array.isArray(exportsValue)) {
    // Re-parsed through packageJsonRawContract rather than left as the bare `object` TS narrowed
    // to: Object.entries on a bare `object` resolves to its `(o: {}): [string, any][]` overload,
    // so `conditions` below would be `any` — and typeof narrowing never moves `any` to `object`,
    // so the nested Object.entries(conditions) two blocks down would carry an unchecked `any`
    // into it. packageJsonRawContract's shape (string keys, unknown values) fits any JSON object,
    // exports subpaths included, and re-parsing keeps Object.entries on its typed overload.
    const exportsRecord = packageJsonRawContract.parse(exportsValue);

    for (const [subpath, conditions] of Object.entries(exportsRecord)) {
      if (typeof conditions === 'string') {
        declarations.push(
          manifestEntryDeclarationContract.parse({
            field: `exports["${subpath}"]`,
            declaredPath: conditions,
          }),
        );
        continue;
      }

      if (conditions !== null && typeof conditions === 'object' && !Array.isArray(conditions)) {
        const conditionsRecord = packageJsonRawContract.parse(conditions);

        for (const [conditionName, conditionTarget] of Object.entries(conditionsRecord)) {
          if (conditionName === SKIPPED_EXPORTS_CONDITION) {
            continue;
          }
          if (typeof conditionTarget === 'string') {
            declarations.push(
              manifestEntryDeclarationContract.parse({
                field: `exports["${subpath}"]["${conditionName}"]`,
                declaredPath: conditionTarget,
              }),
            );
          }
        }
      }
    }
  }

  return declarations;
};

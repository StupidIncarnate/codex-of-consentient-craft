/**
 * PURPOSE: Lists the names an `export =` package lets an importer name, read with TypeScript's own
 * checker from the package's declarations, resolved from the consumer's repo root the way
 * `npmModuleExportShapeBroker` resolves them. A name lands in `values` when it is a property of the
 * `export =` value's type, so it exists at runtime (a function, a class, an enum, an instantiated
 * namespace, a property of an exported object). Every other name the module exports lands in
 * `types`, since it exists only to the type checker (an interface, a type alias, a namespace that
 * holds only types). A name `isReExportableNameGuard` refuses is left out, `default` among them,
 * since the passthrough re-exports the default on its own line. Both lists are sorted, so the barrel written
 * from them is stable. Reach for this only for an `export-equals` package; a package with ES exports
 * gets `export *` and needs no list.
 *
 * USAGE:
 * npmModuleExportNamesBroker({ repoRoot: '/repo', packageName: 'react' });
 * // Returns { values: ['Children', 'Component', ...], types: ['AbstractView', ...] }
 */

import * as ts from '#gateway/npm/typescript';
import { join } from '#gateway/node/path';
import type { GatewayNpmDependency } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import {
  npmModuleExportNamesContract,
  type NpmModuleExportNames,
} from '../../../contracts/npm-module-export-names/npm-module-export-names-contract';
import { isReExportableNameGuard } from '../../../guards/is-re-exportable-name/is-re-exportable-name-guard';

// Never read: resolution only needs a file inside the repo root to walk node_modules up from.
const RESOLUTION_ANCHOR_FILE = 'index.ts';

export const npmModuleExportNamesBroker = ({
  repoRoot,
  packageName,
}: {
  repoRoot: string;
  packageName: GatewayNpmDependency['name'];
}): NpmModuleExportNames => {
  const options: ts.CompilerOptions = {
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.ESNext,
    esModuleInterop: true,
    skipLibCheck: true,
    noEmit: true,
    types: [],
  };
  const { resolvedModule } = ts.resolveModuleName(
    packageName,
    join(repoRoot, RESOLUTION_ANCHOR_FILE),
    options,
    ts.sys,
  );
  const program =
    resolvedModule === undefined
      ? undefined
      : ts.createProgram([resolvedModule.resolvedFileName], options);
  const sourceFile =
    resolvedModule === undefined
      ? undefined
      : program?.getSourceFile(resolvedModule.resolvedFileName);
  const checker = program?.getTypeChecker();
  const moduleSymbol =
    sourceFile === undefined ? undefined : checker?.getSymbolAtLocation(sourceFile);
  const exportEquals = moduleSymbol?.exports?.get(ts.InternalSymbolName.ExportEquals);
  if (checker === undefined || moduleSymbol === undefined || exportEquals === undefined) {
    return npmModuleExportNamesContract.parse({ values: [], types: [] });
  }

  const values = new Set(
    checker
      .getPropertiesOfType(checker.getTypeOfSymbol(exportEquals))
      .map((symbol) => symbol.getName())
      .filter((name) => isReExportableNameGuard({ name })),
  );
  const types = new Set(
    checker
      .getExportsOfModule(moduleSymbol)
      .map((symbol) => symbol.getName())
      .filter((name) => isReExportableNameGuard({ name }) && !values.has(name)),
  );

  return npmModuleExportNamesContract.parse({
    values: [...values].sort(),
    types: [...types].sort(),
  });
};

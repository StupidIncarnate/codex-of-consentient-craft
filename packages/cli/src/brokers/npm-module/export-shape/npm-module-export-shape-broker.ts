/**
 * PURPOSE: Reads an installed npm package's own type declarations, resolved from the consumer's repo
 * root the way a bundler-mode TypeScript import would reach them (`@types/<name>` included), and
 * names which passthrough barrel they call for. Only the entry declaration file's top-level
 * statements decide: an `export =` wins outright, then any `default` export (an `export default`
 * declaration, `export default x`, or a `default` named in an export list) — kept only when the
 * package's CommonJS runtime module really has an own `default` too (`runtimeDefaultLayerBroker`),
 * or when it cannot be loaded to tell; anything else is `named`. A package that resolves to no declaration at all — nothing installed, or a JavaScript
 * file only — is `untyped`. A typed package the consumer's CommonJS npm gateway cannot `require`
 * (`npmModuleEsmOnlyBroker`) is `esm-only`, whatever its declarations look like. Reach for this only
 * to pick a barrel; it reports nothing about which names the package exports.
 *
 * USAGE:
 * npmModuleExportShapeBroker({ repoRoot: '/repo', packageName: 'typescript' });
 * // Returns 'export-equals'
 */

import * as ts from '#gateway/npm/typescript';
import { join } from '#gateway/node/path';
import type { GatewayNpmDependency } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import {
  npmModuleExportShapeContract,
  type NpmModuleExportShape,
} from '../../../contracts/npm-module-export-shape/npm-module-export-shape-contract';
import { npmModuleEsmOnlyBroker } from '../esm-only/npm-module-esm-only-broker';
import { runtimeDefaultLayerBroker } from './runtime-default-layer-broker';

// Never read: resolution only needs a file inside the repo root to walk node_modules up from.
const RESOLUTION_ANCHOR_FILE = 'index.ts';
const DECLARATION_EXTENSIONS = new Set(['.d.ts', '.d.mts', '.d.cts']);
const DEFAULT_EXPORT_NAME = 'default';

export const npmModuleExportShapeBroker = ({
  repoRoot,
  packageName,
}: {
  repoRoot: string;
  packageName: GatewayNpmDependency['name'];
}): NpmModuleExportShape => {
  const { resolvedModule } = ts.resolveModuleName(
    packageName,
    join(repoRoot, RESOLUTION_ANCHOR_FILE),
    { moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext },
    ts.sys,
  );

  if (resolvedModule === undefined || !DECLARATION_EXTENSIONS.has(resolvedModule.extension)) {
    return npmModuleExportShapeContract.parse('untyped');
  }

  if (npmModuleEsmOnlyBroker({ repoRoot, specifier: packageName })) {
    return npmModuleExportShapeContract.parse('esm-only');
  }

  const { statements } = ts.createSourceFile(
    resolvedModule.resolvedFileName,
    ts.sys.readFile(resolvedModule.resolvedFileName) ?? '',
    ts.ScriptTarget.Latest,
    false,
  );

  if (
    statements.some(
      (statement) => ts.isExportAssignment(statement) && statement.isExportEquals === true,
    )
  ) {
    return npmModuleExportShapeContract.parse('export-equals');
  }

  const hasDefault = statements.some((statement) => {
    if (ts.isExportAssignment(statement)) {
      return true;
    }
    if (ts.isExportDeclaration(statement)) {
      const { exportClause } = statement;
      return (
        exportClause !== undefined &&
        ts.isNamedExports(exportClause) &&
        exportClause.elements.some((element) => element.name.text === DEFAULT_EXPORT_NAME)
      );
    }
    const modifiers = ts.canHaveModifiers(statement) ? (ts.getModifiers(statement) ?? []) : [];
    return (
      modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
      modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
    );
  });

  const runtimeDefault = runtimeDefaultLayerBroker({ repoRoot, packageName });
  const exportsDefault = runtimeDefault === null ? hasDefault : hasDefault && runtimeDefault;

  return npmModuleExportShapeContract.parse(exportsDefault ? 'named-and-default' : 'named');
};

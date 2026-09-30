/**
 * PURPOSE: Checks one `#gateway/...` specifier against the linted file's own nearest package.json —
 * mapped by its `imports` field, then declared in `dependencies` (or, for a test-support file,
 * `dependencies` OR `devDependencies`; a `.proxy`/`.stub`/`.harness` file or anything under the package's
 * `test/` folder) — and reports whichever step fails. A package importing its
 * own gateway folder (a file inside `packages/@gateway/npm` importing `#gateway/npm/...`) needs no
 * dependency on itself, so a resolved target matching the linted package's own name is valid with no
 * further check. Shared by every AST listener rule-gateway-dependency-declared-broker registers
 * (import/export-from/dynamic-import, require/require.resolve), so the resolve-then-check sequence
 * lives in one place instead of repeating per listener the way gateway-import-boundary's own checks
 * do — a shared NAMED helper inside `create()` would be a nested (or non-exported, top-level)
 * function, which `@dungeonmaster/forbid-non-exported-functions` refuses.
 *
 * USAGE:
 * validateGatewaySpecifierLayerBroker({
 *   node,
 *   context,
 *   filename: '/repo/packages/hooks/src/x.ts',
 *   specifier: importPathContract.parse('#gateway/npm/zod'),
 * });
 * // Returns false and reports via context when the specifier is unmapped or its target package is
 * // undeclared; returns true, reporting nothing, when the import already resolves to a declared
 * // dependency
 */
import { packageScopeFromNameTransformer } from '@dungeonmaster/shared/transformers';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { gatewayTestSupportSuffixStatics } from '../../../statics/gateway-test-support-suffix/gateway-test-support-suffix-statics';
import { gatewayImportsTargetTransformer } from '../../../transformers/gateway-imports-target/gateway-imports-target-transformer';
import { packageNameFromSpecifierTransformer } from '../../../transformers/package-name-from-specifier/package-name-from-specifier-transformer';
import { dirname } from '#gateway/node/path';
import { findNearestPackageJsonLayerBroker } from './find-nearest-package-json-layer-broker';

export const validateGatewaySpecifierLayerBroker = ({
  node,
  context,
  filename,
  specifier,
}: {
  node: TSESTree.Node;
  context: TSESLint.RuleContext<string, unknown[]>;
  filename: string;
  specifier: string;
}): boolean => {
  const nearestPackageJson = findNearestPackageJsonLayerBroker({
    startDir: dirname(filename),
  });

  if (!nearestPackageJson) {
    return true;
  }

  const { packageJson, packageJsonPath } = nearestPackageJson;

  const target = gatewayImportsTargetTransformer({ importsMap: packageJson.imports, specifier });

  if (!target) {
    const remainder = specifier.slice(gatewayLocationsStatics.importPrefix.length + 1);
    const [folder] = remainder.split('/');
    const scope = packageScopeFromNameTransformer({ rootPackageName: packageJson.name });

    context.report({
      node,
      messageId: 'unmappedSpecifier',
      data: { specifier, packageJsonPath, folder: folder ?? remainder, scope },
    });
    return false;
  }

  const targetPackageName = packageNameFromSpecifierTransformer({ specifier: target });

  if (targetPackageName === packageJson.name) {
    return true;
  }

  // `test/` at the package root never ships, so everything under it is test support.
  const isTestSupportFile =
    gatewayTestSupportSuffixStatics.suffixes.some((suffix) => filename.endsWith(suffix)) ||
    filename.startsWith(`${dirname(packageJsonPath)}/test/`);

  const declaredInDependencies = Boolean(packageJson.dependencies?.[targetPackageName]);

  if (declaredInDependencies) {
    return true;
  }

  const declaredInDevDependencies = Boolean(packageJson.devDependencies?.[targetPackageName]);

  if (isTestSupportFile && declaredInDevDependencies) {
    return true;
  }

  context.report({
    node,
    messageId: 'missingDependency',
    data: {
      packageJsonPath,
      targetPackage: targetPackageName,
      specifier,
      location: isTestSupportFile ? 'dependencies or devDependencies' : 'dependencies',
    },
  });
  return false;
};

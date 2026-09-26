/**
 * PURPOSE: Derives the workspace's `@scope` prefix from a repo's root `package.json` `name` field,
 * so nothing that needs the scope (gatewayPathFromImportSourceTransformer, the gateway ESLint
 * rules) hard-codes `@dungeonmaster` — the same rule set has to work unmodified once the gateway
 * ships into a consumer repo whose root package is named something else. An unscoped root name
 * ('dungeonmaster') becomes its own scope ('@dungeonmaster'); an already-scoped name
 * ('@foo/bar') keeps only the scope segment ('@foo').
 *
 * USAGE:
 * packageScopeFromNameTransformer({ rootPackageName: 'dungeonmaster' });
 * // Returns '@dungeonmaster' as branded PackageName
 * packageScopeFromNameTransformer({ rootPackageName: '@foo/bar' });
 * // Returns '@foo' as branded PackageName
 */
import { packageNameContract } from '../../contracts/package-name/package-name-contract';
import type { PackageName } from '../../contracts/package-name/package-name-contract';

export const packageScopeFromNameTransformer = ({
  rootPackageName,
}: {
  rootPackageName: string;
}): PackageName => {
  if (!rootPackageName.startsWith('@')) {
    return packageNameContract.parse(`@${rootPackageName}`);
  }

  const slashIndex = rootPackageName.indexOf('/');

  if (slashIndex === -1) {
    return packageNameContract.parse(rootPackageName);
  }

  return packageNameContract.parse(rootPackageName.slice(0, slashIndex));
};

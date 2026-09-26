/**
 * PURPOSE: Checks if an import path is a proxy file import (contains '.proxy') or a workspace
 * package's `./testing` subpath barrel (`@dungeonmaster/bin/testing`, `@dungeonmaster/shared/testing`,
 * …). Generalized to any scoped-or-unscoped package name so the AST walk in
 * typescriptAstToProxyImportsAdapter follows a cross-package proxy composed through ANY gateway
 * package's `./testing` barrel, not only `@dungeonmaster/shared`'s.
 *
 * USAGE:
 * isProxyImportGuard({importPath: './test.proxy'});
 * // Returns true if import path contains '.proxy' or is a workspace package's "/testing" subpath
 */

const WORKSPACE_TESTING_SUBPATH_PATTERN = /^(@[a-zA-Z0-9._-]+\/)?[a-zA-Z0-9._-]+\/testing$/u;

export const isProxyImportGuard = ({ importPath }: { importPath?: string }): boolean => {
  if (!importPath) {
    return false;
  }
  return importPath.includes('.proxy') || WORKSPACE_TESTING_SUBPATH_PATTERN.test(importPath);
};

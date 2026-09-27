/**
 * PURPOSE: Checks if an import path is a proxy file import (contains '.proxy') or a workspace
 * package's own caller-facing testing-barrel subpath (`@dungeonmaster/shared/testing`,
 * `#foo/bar/testing`, …). Generalized to any scoped-or-unscoped package name, AND to any
 * `#`-prefixed `imports`-map specifier, so the AST walk in typescriptAstToProxyImportsAdapter
 * follows a cross-package proxy composed through ANY such barrel — whether the caller wrote the
 * package's own name or imported it through its own package.json `imports` map. A gateway import
 * never reaches this second branch: every gateway proxy/stub is imported per file
 * (`#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy`), which the FIRST
 * branch already catches on the literal `.proxy` substring.
 *
 * USAGE:
 * isProxyImportGuard({importPath: './test.proxy'});
 * // Returns true if import path contains '.proxy' or is a workspace package's testing-barrel subpath
 */

const WORKSPACE_TESTING_SUBPATH_PATTERN = /^([@#][a-zA-Z0-9._-]+\/)?[a-zA-Z0-9._-]+\/testing$/u;

export const isProxyImportGuard = ({ importPath }: { importPath?: string }): boolean => {
  if (!importPath) {
    return false;
  }
  return importPath.includes('.proxy') || WORKSPACE_TESTING_SUBPATH_PATTERN.test(importPath);
};

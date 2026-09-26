/**
 * PURPOSE: Checks if an import path is a proxy file import (contains '.proxy') or a workspace
 * package's caller-facing testing-barrel subpath (`@dungeonmaster/shared/testing`,
 * `@dungeonmaster/node/_test_`, `#gateway/npm/_test_`, …). Generalized to any scoped-or-unscoped
 * package name, AND to any `#`-prefixed `imports`-map specifier, so the AST walk in
 * typescriptAstToProxyImportsAdapter follows a cross-package proxy composed through ANY such
 * barrel — whether the caller wrote the gateway package's own name or imported it through its own
 * package.json `imports` map. The four gateway packages (npm, node, browser, bin) export theirs as
 * `./_test_`; every other package still exports `./testing` — both suffixes must match here, or
 * the ts-jest AST transformer that hoists `jest.mock()` silently stops hoisting for whichever
 * suffix or specifier shape this pattern misses.
 *
 * USAGE:
 * isProxyImportGuard({importPath: './test.proxy'});
 * // Returns true if import path contains '.proxy' or is a workspace package's testing-barrel subpath
 */

const WORKSPACE_TESTING_SUBPATH_PATTERN =
  /^([@#][a-zA-Z0-9._-]+\/)?[a-zA-Z0-9._-]+\/(testing|_test_)$/u;

export const isProxyImportGuard = ({ importPath }: { importPath?: string }): boolean => {
  if (!importPath) {
    return false;
  }
  return importPath.includes('.proxy') || WORKSPACE_TESTING_SUBPATH_PATTERN.test(importPath);
};

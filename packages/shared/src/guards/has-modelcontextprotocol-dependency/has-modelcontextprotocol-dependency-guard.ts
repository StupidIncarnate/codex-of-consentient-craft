/**
 * PURPOSE: Returns true when package.json dependencies include '@modelcontextprotocol/sdk'. The
 * declared-dependency signal for an MCP server whose flow imports nothing from outside its own
 * package. Callers pair it with a flows folder: the `@gateway/npm` package also lists the SDK, and
 * has no flows.
 *
 * USAGE:
 * hasModelcontextprotocolDependencyGuard({ packageJson: PackageJsonStub({ dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' } }) });
 * // Returns true — the SDK is in dependencies
 */

import type { PackageJson } from '../../contracts/package-json/package-json-contract';

export const hasModelcontextprotocolDependencyGuard = ({
  packageJson,
}: {
  packageJson?: PackageJson;
}): boolean => {
  if (packageJson === undefined) {
    return false;
  }
  const { dependencies } = packageJson;
  if (dependencies === undefined) {
    return false;
  }
  return Object.hasOwn(dependencies, '@modelcontextprotocol/sdk');
};

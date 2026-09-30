/**
 * PURPOSE: Walks up from a starting directory to the npm-workspaces root — the nearest ancestor
 * package.json carrying a `workspaces` field, per this repo's own "every consumer repo is an
 * npm-workspaces monorepo" constraint — and returns that root's directory, its OWN `name` field,
 * and every package name its `dependencies`/`devDependencies` declare. enforce-proxy-child-creation
 * reads `rootPackageJsonName` to derive THIS workspace's own npm scope for a bare `@scope/pkg` root
 * import; enforce-gateway-config-names-exist reads `packageNames` to check a `restrictedTo` entry's
 * `packages` against the real workspace package list, and resolves a `#gateway/...` subpath against
 * this same root's `packages/@gateway/` tree. An ordinary broker, not a layer file, precisely so both
 * rules import ONE copy of this walk instead of each keeping its own.
 *
 * USAGE:
 * workspaceRootFindBroker({ startDir: filePathContract.parse(__dirname) });
 * // Returns { rootDir: '/repo', rootPackageJsonName: '@dungeonmaster/hooks', packageNames: [...] },
 * // or undefined when no ancestor package.json carries a `workspaces` field
 */
import { existsSync, readFileSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';
import { workspaceRootPackageJsonContract } from '../../../contracts/workspace-root-package-json/workspace-root-package-json-contract';
import { gatewayConsumerPackageJsonContract } from '../../../contracts/gateway-consumer-package-json/gateway-consumer-package-json-contract';

export const workspaceRootFindBroker = ({
  startDir,
}: {
  startDir: string;
}):
  | { rootDir: string; rootPackageJsonName: string; packageNames: string[] }
  | undefined => {
  const packageJsonPath = join(startDir, 'package.json');

  if (existsSync(packageJsonPath)) {
    const contents = readFileSync(packageJsonPath);
    const workspaceRoot = workspaceRootPackageJsonContract.safeParse(JSON.parse(contents));

    if (workspaceRoot.success) {
      const withDeps = gatewayConsumerPackageJsonContract.parse(JSON.parse(contents));
      const packageNames = Object.keys({
        ...withDeps.dependencies,
        ...withDeps.devDependencies,
      }).map((name) => name);

      return {
        rootDir: startDir,
        rootPackageJsonName: workspaceRoot.data.name,
        packageNames,
      };
    }
  }

  const parentDir = dirname(startDir);
  if (parentDir === startDir) {
    return undefined;
  }

  return workspaceRootFindBroker({ startDir: parentDir });
};

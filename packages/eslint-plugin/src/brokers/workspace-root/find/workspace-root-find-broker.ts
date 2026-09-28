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
import { filePathContract, packageNameContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, PackageName } from '@dungeonmaster/shared/contracts';
import { existsSync } from '#gateway/node/fs';
import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { workspaceRootPackageJsonContract } from '../../../contracts/workspace-root-package-json/workspace-root-package-json-contract';
import { gatewayConsumerPackageJsonContract } from '../../../contracts/gateway-consumer-package-json/gateway-consumer-package-json-contract';

export const workspaceRootFindBroker = ({
  startDir,
}: {
  startDir: FilePath;
}):
  | { rootDir: FilePath; rootPackageJsonName: PackageName; packageNames: PackageName[] }
  | undefined => {
  const packageJsonPath = pathJoinAdapter({ paths: [startDir, 'package.json'] });

  if (existsSync(packageJsonPath)) {
    const contents = fsReadFileSyncAdapter({ filePath: packageJsonPath });
    const parsed: unknown = JSON.parse(contents);
    const workspaceRoot = workspaceRootPackageJsonContract.safeParse(parsed);

    if (workspaceRoot.success) {
      const withDeps = gatewayConsumerPackageJsonContract.parse(parsed);
      const packageNames = Object.keys({
        ...withDeps.dependencies,
        ...withDeps.devDependencies,
      }).map((name) => packageNameContract.parse(name));

      return {
        rootDir: startDir,
        rootPackageJsonName: packageNameContract.parse(workspaceRoot.data.name),
        packageNames,
      };
    }
  }

  const parentDir = pathDirnameAdapter({ filePath: startDir });
  if (parentDir === startDir) {
    return undefined;
  }

  return workspaceRootFindBroker({ startDir: filePathContract.parse(parentDir) });
};

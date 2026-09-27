/**
 * PURPOSE: Walks up from a starting directory to the npm-workspaces root — the nearest ancestor
 * package.json carrying a `workspaces` field, per this repo's own "every consumer repo is an
 * npm-workspaces monorepo" constraint — and returns that directory along with every package name its
 * `dependencies`/`devDependencies` declare, which is what a consumer's own `dungeonmaster init` run
 * writes into (see packages/CLAUDE.md, "Why root registration matters"). enforce-gateway-config-names-exist
 * checks a `restrictedTo` entry's `packages` against this list, and resolves a `#gateway/...` subpath
 * against this same root's `packages/@gateway/` tree. Duplicated from gateway-import-boundary's
 * identically-shaped `resolveRepoScopeLayerBroker`, deliberately: a layer file is not an entry file
 * another domain may import.
 *
 * USAGE:
 * findWorkspaceRootLayerBroker({ startDir: filePathContract.parse(__dirname) });
 * // Returns { rootDir: '/repo', packageNames: ['@dungeonmaster/hooks', ...] }, or undefined when no
 * // ancestor package.json carries a `workspaces` field
 */
import { filePathContract, packageNameContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, PackageName } from '@dungeonmaster/shared/contracts';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { workspaceRootPackageJsonContract } from '../../../contracts/workspace-root-package-json/workspace-root-package-json-contract';
import { gatewayConsumerPackageJsonContract } from '../../../contracts/gateway-consumer-package-json/gateway-consumer-package-json-contract';

export const findWorkspaceRootLayerBroker = ({
  startDir,
}: {
  startDir: FilePath;
}): { rootDir: FilePath; packageNames: PackageName[] } | undefined => {
  const packageJsonPath = pathJoinAdapter({ paths: [startDir, 'package.json'] });

  if (fsExistsSyncAdapter({ filePath: packageJsonPath })) {
    const contents = fsReadFileSyncAdapter({ filePath: packageJsonPath });
    const parsed: unknown = JSON.parse(contents);
    const workspaceRoot = workspaceRootPackageJsonContract.safeParse(parsed);

    if (workspaceRoot.success) {
      const withDeps = gatewayConsumerPackageJsonContract.parse(parsed);
      const packageNames = Object.keys({
        ...withDeps.dependencies,
        ...withDeps.devDependencies,
      }).map((name) => packageNameContract.parse(name));
      return { rootDir: startDir, packageNames };
    }
  }

  const parentDir = pathDirnameAdapter({ filePath: startDir });
  if (parentDir === startDir) {
    return undefined;
  }

  return findWorkspaceRootLayerBroker({ startDir: filePathContract.parse(parentDir) });
};

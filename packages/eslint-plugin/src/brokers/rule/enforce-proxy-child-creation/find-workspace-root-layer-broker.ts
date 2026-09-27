/**
 * PURPOSE: Walks up from a starting directory to the npm-workspaces root — the nearest ancestor
 * package.json carrying a `workspaces` field, per this repo's own "every consumer repo is an
 * npm-workspaces monorepo" constraint — and returns that directory along with its OWN `name` field.
 * enforce-proxy-child-creation reads that name to derive THIS workspace's own npm scope for a bare
 * `@scope/pkg` root import — never a hardcoded `@dungeonmaster`, which would only ever match this
 * repo and never a published consumer's own scope, and never a scan of `dependencies`/
 * `devDependencies`: a consumer's root `devDependencies` carry `@dungeonmaster/*` tooling `dungeonmaster
 * init` installs, and a fresh consumer with no workspace package registered to root `dependencies` yet
 * has nothing else scoped there — a dependency scan would misread the TOOL VENDOR's scope as the
 * consumer's own. Duplicated from enforce-gateway-config-names-exist's identically-shaped
 * `findWorkspaceRootLayerBroker`, deliberately: a layer file is not an entry file another domain may
 * import.
 *
 * USAGE:
 * findWorkspaceRootLayerBroker({ startDir: filePathContract.parse(__dirname) });
 * // Returns { rootDir: '/repo', rootPackageJsonName: '@dungeonmaster/hooks' }, or undefined when no
 * // ancestor package.json carries a `workspaces` field
 */
import { filePathContract, packageNameContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, PackageName } from '@dungeonmaster/shared/contracts';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { workspaceRootPackageJsonContract } from '../../../contracts/workspace-root-package-json/workspace-root-package-json-contract';

export const findWorkspaceRootLayerBroker = ({
  startDir,
}: {
  startDir: FilePath;
}): { rootDir: FilePath; rootPackageJsonName: PackageName } | undefined => {
  const packageJsonPath = pathJoinAdapter({ paths: [startDir, 'package.json'] });

  if (fsExistsSyncAdapter({ filePath: packageJsonPath })) {
    const contents = fsReadFileSyncAdapter({ filePath: packageJsonPath });
    const parsed: unknown = JSON.parse(contents);
    const workspaceRoot = workspaceRootPackageJsonContract.safeParse(parsed);

    if (workspaceRoot.success) {
      return {
        rootDir: startDir,
        rootPackageJsonName: packageNameContract.parse(workspaceRoot.data.name),
      };
    }
  }

  const parentDir = pathDirnameAdapter({ filePath: startDir });
  if (parentDir === startDir) {
    return undefined;
  }

  return findWorkspaceRootLayerBroker({ startDir: filePathContract.parse(parentDir) });
};

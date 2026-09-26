/**
 * PURPOSE: Reads this rule's own `@scope`, the same way raw-import-ban's own repo-scope walk does —
 * reusing its SAME shared pieces (`workspaceRootPackageJsonContract`, `packageScopeFromNameTransformer`)
 * rather than importing raw-import-ban's own `resolve-repo-scope-layer-broker.ts` directly, which
 * `enforce-project-structure`'s layer-file rule forbids across rule folders ("no file outside the
 * folder imports a layer"). Walks up from a real directory to the nearest ancestor `package.json`
 * carrying a `workspaces` field, exactly as raw-import-ban's walk does, so this rule finds THIS
 * repo's root when it runs from source and a consumer's own root once this package is installed.
 *
 * USAGE:
 * resolveRepoScopeLayerBroker({ startDir: filePathContract.parse(__dirname) });
 * // Returns '@dungeonmaster' as branded PackageName, read from the repo root package.json's name
 */
import type { FilePath, PackageName } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { packageScopeFromNameTransformer } from '@dungeonmaster/shared/transformers';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { workspaceRootPackageJsonContract } from '../../../contracts/workspace-root-package-json/workspace-root-package-json-contract';

export const resolveRepoScopeLayerBroker = ({ startDir }: { startDir: FilePath }): PackageName => {
  const packageJsonPath = filePathContract.parse(`${startDir}/package.json`);

  if (fsExistsSyncAdapter({ filePath: packageJsonPath })) {
    const contents = fsReadFileSyncAdapter({ filePath: packageJsonPath });
    const parsedPackageJson: unknown = JSON.parse(contents);
    const workspaceRoot = workspaceRootPackageJsonContract.safeParse(parsedPackageJson);

    if (workspaceRoot.success) {
      return packageScopeFromNameTransformer({ rootPackageName: workspaceRoot.data.name });
    }
  }

  const lastSlashIndex = startDir.lastIndexOf('/');
  const parentDir = lastSlashIndex <= 0 ? '/' : startDir.slice(0, lastSlashIndex);

  if (parentDir === startDir) {
    throw new Error(
      `bin-program-spawn-ban could not find a workspaces root package.json walking up from "${startDir}".`,
    );
  }

  return resolveRepoScopeLayerBroker({ startDir: filePathContract.parse(parentDir) });
};

/**
 * PURPOSE: Walks up from a starting directory to the nearest ancestor `package.json` that carries
 * a `workspaces` field — the npm-workspaces ROOT, per this repo's own "every consumer repo is an
 * npm-workspaces monorepo" constraint — and derives the `@scope` gateway-import-boundary compares
 * every workspace import against. Walking from a real directory (rather than reading
 * `process.cwd()`, which `@dungeonmaster/no-bare-process-cwd` reserves for CLI entry points and
 * path-resolver brokers) means the same walk finds THIS repo's root when the rule runs from
 * source, and a consumer's own root once this package is installed under their `node_modules`.
 * Directories are joined with a plain "/" rather than `pathJoinAdapter`: every path here is already
 * POSIX-absolute (`__dirname` at rule-module load, or a value this same function derived), so no
 * adapter's cross-platform behaviour is needed, and skipping it keeps this broker's only child
 * proxy the fs one its own test actually stages. Duplicated from raw-import-ban's identically-named
 * layer, deliberately: a layer file is not an entry file another domain may import.
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
      `gateway-import-boundary could not find a workspaces root package.json walking up from "${startDir}".`,
    );
  }

  return resolveRepoScopeLayerBroker({ startDir: filePathContract.parse(parentDir) });
};

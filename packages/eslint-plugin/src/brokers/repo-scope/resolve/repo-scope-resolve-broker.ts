/**
 * PURPOSE: Walks up from a starting directory to the nearest ancestor `package.json` that carries
 * a `workspaces` field — the npm-workspaces ROOT, per this repo's own "every consumer repo is an
 * npm-workspaces monorepo" constraint — and derives the `@scope` raw-import-ban, gateway-import-boundary
 * and bin-program-spawn-ban all build their gateway-path checks from. One ordinary broker, not a
 * layer file, precisely so the three rules import ONE copy instead of each keeping its own — the
 * same fix F4 made for `workspaceRootFindBroker`. Each rule passes the directory of the file it
 * lints, so the walk finds the root of the repo that owns that file. Starting from this module's own
 * location instead would find dungeonmaster's root for a consumer that links dungeonmaster through
 * `file:`. Directories are joined with a plain "/" rather than `join`: every path here is already
 * POSIX-absolute (the linted file's directory, or a value this same function derived), so no
 * cross-platform behaviour is needed, and skipping it keeps this broker's only child proxy
 * the fs one its own test actually stages. Derives the scope via `packageScopeFromNameTransformer`
 * directly, not the tolerant `workspaceScopeFromRootNameTransformer` (F4, in `shared`):
 * `workspaceRootPackageJsonContract` already guarantees `name` is a non-empty string once a
 * package.json parses as the workspaces root, so there is nothing missing for a fallback to stand in
 * for, and every caller here needs the `PackageName` brand the direct transformer returns, not
 * `workspaceScopeFromRootNameTransformer`'s `PathSegment`.
 *
 * USAGE:
 * repoScopeResolveBroker({ startDir: '/repo/packages/hooks/src/brokers/x' });
 * // Returns '@dungeonmaster' as branded PackageName, read from /repo/package.json's name
 */
import { packageScopeFromNameTransformer } from '@dungeonmaster/shared/transformers';
import { existsSync, readFileSync } from '#gateway/node/fs';
import { workspaceRootPackageJsonContract } from '../../../contracts/workspace-root-package-json/workspace-root-package-json-contract';

export const repoScopeResolveBroker = ({ startDir }: { startDir: string }): string => {
  const packageJsonPath = `${startDir}/package.json`;

  if (existsSync(packageJsonPath)) {
    const contents = readFileSync(packageJsonPath);
    const workspaceRoot = workspaceRootPackageJsonContract.safeParse(JSON.parse(contents));

    if (workspaceRoot.success) {
      return packageScopeFromNameTransformer({ rootPackageName: workspaceRoot.data.name });
    }
  }

  const lastSlashIndex = startDir.lastIndexOf('/');
  const parentDir = lastSlashIndex <= 0 ? '/' : startDir.slice(0, lastSlashIndex);

  if (parentDir === startDir) {
    throw new Error(
      `repoScopeResolveBroker could not find a workspaces root package.json walking up from "${startDir}".`,
    );
  }

  return repoScopeResolveBroker({ startDir: parentDir });
};
